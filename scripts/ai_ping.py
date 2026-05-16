#!/usr/bin/env python3
"""Call OpenRouter with the 2+2 smoke prompt. Requires OPENROUTER_API_KEY in .env."""

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "backend"))

from pm_backend.ai import AiError, complete_chat, math_smoke_prompt, reply_contains_four
from pm_backend.config import get_openrouter_model


def main() -> int:
    prompt = math_smoke_prompt()
    try:
        reply = complete_chat(prompt)
    except AiError as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1

    ok = reply_contains_four(reply)
    print(f"model: {get_openrouter_model()}")
    print(f"prompt: {prompt}")
    print(f"reply: {reply}")
    print(f"ok: {ok}")
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
