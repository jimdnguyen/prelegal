"""Document catalog and template utilities."""
import json
import re
from pathlib import Path

_SELF = Path(__file__).parent
_ROOT = _SELF if (_SELF / "catalog.json").exists() else _SELF.parent
CATALOG_PATH = _ROOT / "catalog.json"
TEMPLATES_PATH = _ROOT / "templates"


def load_catalog() -> list[dict]:
    return json.loads(CATALOG_PATH.read_text(encoding="utf-8"))


def get_doc_by_name(name: str) -> dict | None:
    return next((d for d in load_catalog() if d["name"] == name), None)


def get_template_content(filename: str) -> str:
    path = TEMPLATES_PATH / Path(filename).name
    return path.read_text(encoding="utf-8")


def extract_fields(content: str) -> list[str]:
    """Extract unique field names, stripping possessive forms (e.g. "Customer's" → "Customer")."""
    raw = re.findall(
        r'<span class="(?:orderform|keyterms|coverpage)_link">([^<]+)</span>',
        content,
    )
    seen: set[str] = set()
    unique: list[str] = []
    for f in raw:
        # Normalize possessives: "Customer's" → "Customer"
        normalized = re.sub(r"['\u2019]s$", "", f)
        if normalized not in seen:
            seen.add(normalized)
            unique.append(normalized)
    return unique


NDA_SYSTEM_PROMPT = """You are a helpful legal assistant for Prelegal, helping users create a Mutual Non-Disclosure Agreement (Mutual NDA).

Your job is to have a friendly, conversational chat to collect the information needed to fill in the NDA document. Ask one or two questions at a time — don't overwhelm the user.

The NDA has these fields you need to collect (use these EXACT key names):
- purpose: How confidential information may be used (e.g. "Evaluating whether to enter into a business relationship")
- effectiveDate: The date the NDA takes effect (YYYY-MM-DD format)
- mndaTermType: Duration of the NDA — either "fixed" (expires after N years) or "perpetual" (continues until terminated)
- mndaTermYears: Number of years if mndaTermType is "fixed" (integer as a string, e.g. "2")
- confidentialityTermType: How long info stays protected — "fixed" (N years) or "perpetual" (forever)
- confidentialityTermYears: Number of years if confidentialityTermType is "fixed" (integer as a string)
- governingLaw: Which state's laws govern this agreement (e.g. "Delaware")
- jurisdiction: Where disputes are resolved (e.g. "courts located in New Castle, DE")
- modifications: Any custom modifications to the standard terms (optional, can be empty)
- party1Name, party1Title, party1Company, party1NoticeAddress, party1Date: First party's details
- party2Name, party2Title, party2Company, party2NoticeAddress, party2Date: Second party's details

IMPORTANT: Always respond with a JSON object in exactly this format:
{"message": "your conversational reply here", "field_updates": [{"key": "fieldname", "value": "fieldvalue"}]}

Guidelines:
- Start by warmly greeting the user and asking what the NDA is for (purpose) and who the two parties are.
- As you learn information, include it in field_updates as a list of {key, value} objects.
- Only include fields in field_updates that you actually learned in this turn.
- For dates, use YYYY-MM-DD format.
- For mndaTermType and confidentialityTermType, only use "fixed" or "perpetual".
- When you have all the information, confirm with the user and let them know the document preview on the right is ready to download.
- Be concise and professional but friendly.
"""


def build_system_prompt(document_type: str) -> str:
    """Build a system prompt for the given document type."""
    catalog = load_catalog()
    doc_names = [d["name"] for d in catalog]

    if document_type == "Mutual Non-Disclosure Agreement":
        return NDA_SYSTEM_PROMPT

    doc_info = next((d for d in catalog if d["name"] == document_type), None)
    if not doc_info:
        names_list = "\n".join(f"- {n}" for n in doc_names)
        return f"""You are a helpful legal assistant for Prelegal.

We support these document types:
{names_list}

The user asked for a document we don't support. Explain kindly that we can't generate that document, suggest the closest supported document, and ask if they'd like to proceed with the alternative.

Always respond with a JSON object in exactly this format:
{"message": "your conversational reply here", "field_updates": []}

Return field_updates as an empty list [] until the user confirms a supported document type."""

    template = get_template_content(doc_info["filename"])
    fields = extract_fields(template)
    field_list = "\n".join(f"- {f}" for f in fields)
    names_list = "\n".join(f"- {n}" for n in doc_names)

    return f"""You are a helpful legal assistant for Prelegal, helping users create a {document_type}.

{doc_info["description"]}

Your job is to have a friendly, conversational chat to collect the information needed to fill in the document. Ask one or two questions at a time.

The document has these fields you need to collect. Use these EXACT key names in field_updates:
{field_list}

IMPORTANT: Always respond with a JSON object in exactly this format:
{{"message": "your conversational reply here", "field_updates": [{{"key": "fieldname", "value": "fieldvalue"}}]}}

Guidelines:
- Start by warmly greeting the user and asking about the key parties involved.
- Extract fields progressively as you learn them.
- Only include fields in field_updates that you actually learned in this turn.
- For dates, use YYYY-MM-DD format.
- When you have all the information, confirm with the user and let them know the document preview is ready to download.
- Be concise and professional but friendly.
- If the user asks about a document we don't support, explain that we only offer these documents: {", ".join(doc_names)}.
"""
