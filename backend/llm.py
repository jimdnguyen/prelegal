"""LiteLLM integration for AI chat and document field extraction."""
from litellm import completion

from documents import build_system_prompt
from models import ChatMessage, ChatResponse


def chat(messages: list[ChatMessage], document_type: str) -> ChatResponse:
    """Send chat messages to the LLM and return a response with extracted document fields."""
    system_prompt = build_system_prompt(document_type)
    llm_messages = [{"role": "system", "content": system_prompt}]
    llm_messages += [{"role": m.role, "content": m.content} for m in messages]

    call_kwargs = {
        "model": "openrouter/free",
        "messages": llm_messages,
        "extra_body": {"provider": {"order": ["cerebras"]}},
        "response_format": ChatResponse,
    }

    response = completion(**call_kwargs)
    result = response.choices[0].message.content or "{}"
    return ChatResponse.model_validate_json(result)
