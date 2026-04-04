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
        "model": "openrouter/openai/gpt-oss-120b:free",
        "messages": llm_messages,
        "response_format": {"type": "json_object"},
        "extra_body": {
            "models": [
                "openai/gpt-oss-120b:free",
                "qwen/qwen3.6-plus:free",
                "nvidia/nemotron-3-super-120b-a12b:free",
            ],
            "route": "fallback",
        },
    }

    response = completion(**call_kwargs)
    result = response.choices[0].message.content or "{}"
    return ChatResponse.model_validate_json(result)
