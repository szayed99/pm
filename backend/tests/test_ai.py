from unittest.mock import patch

import pytest
from pm_backend.ai import AiError, complete_chat, math_smoke_prompt, reply_contains_four


def test_reply_contains_four():
    assert reply_contains_four("4") is True
    assert reply_contains_four("The answer is 4.") is True
    assert reply_contains_four("five") is False


def test_complete_chat_without_api_key(monkeypatch):
    monkeypatch.delenv("OPENROUTER_API_KEY", raising=False)
    with pytest.raises(AiError, match="OPENROUTER_API_KEY"):
        complete_chat(math_smoke_prompt())


def test_complete_chat_parses_response(monkeypatch):
    monkeypatch.setenv("OPENROUTER_API_KEY", "test-key")

    mock_response = type(
        "Resp",
        (),
        {
            "raise_for_status": lambda self: None,
            "json": lambda self: {
                "choices": [{"message": {"content": "4"}}],
            },
        },
    )()

    with patch("pm_backend.ai.httpx.post", return_value=mock_response) as post:
        reply = complete_chat(math_smoke_prompt())

    assert reply == "4"
    post.assert_called_once()
    call_kwargs = post.call_args.kwargs
    assert call_kwargs["headers"]["Authorization"] == "Bearer test-key"
    assert call_kwargs["json"]["messages"][0]["content"] == math_smoke_prompt()


def test_ai_test_endpoint(auth_client, monkeypatch):
    monkeypatch.setenv("OPENROUTER_API_KEY", "test-key")
    mock_response = type(
        "Resp",
        (),
        {
            "raise_for_status": lambda self: None,
            "json": lambda self: {
                "choices": [{"message": {"content": "4"}}],
            },
        },
    )()

    with patch("pm_backend.ai.httpx.post", return_value=mock_response):
        response = auth_client.post("/api/ai/test", json={})

    assert response.status_code == 200
    data = response.json()
    assert data["reply"] == "4"
    assert data["ok"] is True
    assert "model" in data


def test_ai_test_requires_auth(client):
    response = client.post("/api/ai/test", json={})
    assert response.status_code == 401
