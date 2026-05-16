import json
import re
from typing import Any

import httpx

from pm_backend.config import get_openrouter_api_key, get_openrouter_model

OPENROUTER_CHAT_URL = "https://openrouter.ai/api/v1/chat/completions"

HARMONY_FINAL_RE = re.compile(
    r"<\|channel\|>final<\|message\|>(.*?)(?:<\|end\|>|<\|start\|>|$)",
    re.DOTALL,
)


class AiError(Exception):
    pass


def extract_harmony_final(text: str) -> str:
    matches = HARMONY_FINAL_RE.findall(text)
    if matches:
        return matches[-1].strip()
    return text


def _usable_text(value: Any) -> str | None:
    if not isinstance(value, str):
        return None
    text = value.strip()
    if not text or text.lower() == "null":
        return None
    return text


def extract_message_text(message: dict[str, Any]) -> str:
    content = message.get("content")
    usable = _usable_text(content)
    if usable:
        return extract_harmony_final(usable)

    if isinstance(content, list):
        parts: list[str] = []
        for part in content:
            if isinstance(part, dict) and part.get("type") == "text":
                text = part.get("text")
                if isinstance(text, str) and text.strip():
                    parts.append(text)
        if parts:
            return extract_harmony_final("\n".join(parts).strip())

    for key in ("reasoning", "reasoning_content"):
        usable = _usable_text(message.get(key))
        if usable:
            return extract_harmony_final(usable)

    raise AiError("OpenRouter returned an empty assistant message")


def post_chat_completion(
    messages: list[dict[str, str]],
    *,
    response_format: dict[str, Any] | None = None,
) -> str:
    api_key = get_openrouter_api_key()
    if not api_key:
        raise AiError("OPENROUTER_API_KEY is not set")

    payload: dict[str, Any] = {
        "model": get_openrouter_model(),
        "messages": messages,
    }
    if response_format is not None:
        payload["response_format"] = response_format

    try:
        response = httpx.post(
            OPENROUTER_CHAT_URL,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=90.0,
        )
        response.raise_for_status()
        data = response.json()
        message = data["choices"][0]["message"]
        if not isinstance(message, dict):
            raise AiError("Unexpected OpenRouter response shape")
        return extract_message_text(message)
    except httpx.HTTPError as exc:
        raise AiError(f"OpenRouter request failed: {exc}") from exc
    except (KeyError, IndexError, TypeError) as exc:
        raise AiError("Unexpected OpenRouter response shape") from exc


def complete_chat(prompt: str) -> str:
    return post_chat_completion([{"role": "user", "content": prompt}])


def math_smoke_prompt() -> str:
    return "What is 2+2? Reply with only the number."


def reply_contains_four(reply: str) -> bool:
    return "4" in reply
