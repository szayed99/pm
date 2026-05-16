import json
from pathlib import Path
from unittest.mock import patch

import pytest

from pm_backend.ai_chat import (
    AiParseError,
    ChatTurn,
    build_messages,
    parse_ai_payload,
    run_kanban_chat,
)
from pm_backend.ai import extract_message_text

SEED_PATH = (
    Path(__file__).resolve().parents[1] / "pm_backend" / "seed" / "board.example.json"
)


@pytest.fixture()
def sample_board():
    from pm_backend.models import BoardData

    return BoardData.model_validate_json(SEED_PATH.read_text(encoding="utf-8"))


def test_build_messages_includes_board_and_user_request(sample_board):
    messages = build_messages(
        sample_board,
        [ChatTurn(role="user", content="Earlier question")],
        "Add a card for release checklist",
    )
    assert messages[0]["role"] == "system"
    assert messages[1]["content"] == "Earlier question"
    assert "col-backlog" in messages[-1]["content"]
    assert "Add a card for release checklist" in messages[-1]["content"]


def test_parse_operations_rename_column(sample_board):
    content = json.dumps(
        {
            "message": "Renamed the column.",
            "operations": [
                {
                    "type": "rename_column",
                    "columnId": "col-review",
                    "title": "Under Review",
                }
            ],
        }
    )
    parsed = parse_ai_payload(content, sample_board)
    assert parsed.message == "Renamed the column."
    assert parsed.board is not None
    review = next(c for c in parsed.board.columns if c.id == "col-review")
    assert review.title == "Under Review"


def test_parse_text_only_response(sample_board):
    content = json.dumps({"message": "Here is my advice.", "operations": None})
    parsed = parse_ai_payload(content, sample_board)
    assert parsed.message == "Here is my advice."
    assert parsed.board is None


def test_parse_legacy_full_board(sample_board):
    updated = sample_board.model_copy(deep=True)
    updated.columns[0].title = "Ideas"
    content = json.dumps(
        {"message": "Renamed the first column.", "board": updated.model_dump()}
    )
    parsed = parse_ai_payload(content, sample_board)
    assert parsed.board is not None
    assert parsed.board.columns[0].title == "Ideas"


def test_parse_board_only_payload(sample_board):
    updated = sample_board.model_copy(deep=True)
    updated.columns[0].title = "Ideas"
    content = json.dumps(updated.model_dump())
    parsed = parse_ai_payload(content, sample_board)
    assert parsed.board is not None
    assert parsed.board.columns[0].title == "Ideas"


def test_parse_rejects_invalid_json(sample_board):
    with pytest.raises(AiParseError):
        parse_ai_payload("not json", sample_board)


def test_parse_rejects_broken_operations(sample_board):
    content = json.dumps(
        {
            "message": "Done",
            "operations": [
                {"type": "rename_column", "columnId": "missing", "title": "X"}
            ],
        }
    )
    with pytest.raises(AiParseError):
        parse_ai_payload(content, sample_board)


def test_run_kanban_chat_mocked(sample_board, monkeypatch):
    monkeypatch.setenv("OPENROUTER_API_KEY", "test-key")
    payload = json.dumps({"message": "OK", "operations": None})

    with patch("pm_backend.ai_chat.post_chat_completion", return_value=payload):
        result = run_kanban_chat(sample_board, [], "Summarize the board")

    assert result.message == "OK"
    assert result.board is None


def test_extract_message_text_skips_null_content():
    message = {
        "content": "null",
        "reasoning": '{"message": "Hi", "operations": null}',
    }
    assert extract_message_text(message) == '{"message": "Hi", "operations": null}'


def test_ai_chat_endpoint_text_only(auth_client, sample_board, monkeypatch):
    monkeypatch.setenv("OPENROUTER_API_KEY", "test-key")
    payload = json.dumps({"message": "You have eight cards.", "operations": None})

    with patch("pm_backend.ai_chat.post_chat_completion", return_value=payload):
        response = auth_client.post(
            "/api/ai/chat",
            json={"message": "How many cards?", "history": []},
        )

    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "You have eight cards."
    assert data["board"] is None


def test_ai_chat_endpoint_saves_board_update(
    auth_client, sample_board, monkeypatch
):
    monkeypatch.setenv("OPENROUTER_API_KEY", "test-key")
    payload = json.dumps(
        {
            "message": "Renamed the backlog column.",
            "operations": [
                {
                    "type": "rename_column",
                    "columnId": "col-backlog",
                    "title": "AI Renamed",
                }
            ],
        }
    )

    with patch("pm_backend.ai_chat.post_chat_completion", return_value=payload):
        response = auth_client.post(
            "/api/ai/chat",
            json={"message": "Rename backlog to AI Renamed", "history": []},
        )

    assert response.status_code == 200
    assert response.json()["board"]["columns"][0]["title"] == "AI Renamed"

    board_response = auth_client.get("/api/board")
    assert board_response.json()["columns"][0]["title"] == "AI Renamed"


def test_ai_chat_endpoint_requires_auth(client):
    response = client.post(
        "/api/ai/chat",
        json={"message": "Hello", "history": []},
    )
    assert response.status_code == 401
