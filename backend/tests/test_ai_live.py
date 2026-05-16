import os

import pytest

from pm_backend.ai import complete_chat, math_smoke_prompt, reply_contains_four
from pm_backend.config import get_openrouter_api_key

pytestmark = pytest.mark.skipif(
    not get_openrouter_api_key(),
    reason="OPENROUTER_API_KEY not set; live AI test skipped",
)


def test_openrouter_math_smoke_live():
    reply = complete_chat(math_smoke_prompt())
    assert reply_contains_four(reply), f"Expected 4 in reply, got: {reply!r}"
