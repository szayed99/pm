import json
from typing import Any, Literal

from pydantic import BaseModel, ValidationError

from pm_backend.ai import post_chat_completion
from pm_backend.board_ops import BoardOperation, apply_operations
from pm_backend.models import BoardData, validate_board

SYSTEM_PROMPT = """You are a Kanban board assistant. The user message includes the current board as JSON.

Reply with JSON only in this shape:
{"message": "<short reply to the user>", "operations": <array or null>}

Use operations to change the board. Apply the smallest set of operations needed.
Do NOT return the full board.

Operation types:
- rename_column: {"type":"rename_column","columnId":"col-review","title":"Under Review"}
- add_card: {"type":"add_card","columnId":"col-backlog","title":"...","details":"..."}
- update_card: {"type":"update_card","cardId":"card-1","title":"...","details":"..."}
- move_card: {"type":"move_card","cardId":"card-1","columnId":"col-done"}
- delete_card: {"type":"delete_card","cardId":"card-1"}

Column ids: col-backlog, col-discovery, col-progress, col-review, col-done.
For questions with no board changes, set "operations" to null."""


class ChatTurn(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class AiStructuredResponse(BaseModel):
    message: str
    board: BoardData | None = None


class AiParseError(ValueError):
    pass


class AiPayload(BaseModel):
    message: str | None = None
    operations: list[BoardOperation] | None = None
    board: BoardData | None = None


def json_object_response_format() -> dict[str, Any]:
    return {"type": "json_object"}


def build_messages(
    board: BoardData,
    history: list[ChatTurn],
    user_message: str,
) -> list[dict[str, str]]:
    board_json = json.dumps(board.model_dump())
    user_content = (
        f"Current board JSON:\n{board_json}\n\nUser request:\n{user_message}"
    )
    messages: list[dict[str, str]] = [{"role": "system", "content": SYSTEM_PROMPT}]
    for turn in history:
        messages.append({"role": turn.role, "content": turn.content})
    messages.append({"role": "user", "content": user_content})
    return messages


def extract_json_text(content: str) -> str:
    text = content.strip()
    if not text or text.lower() == "null":
        return ""

    if text.startswith("```"):
        lines = text.splitlines()
        if lines and lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        text = "\n".join(lines).strip()

    if text.startswith("{") or text.startswith("["):
        return text

    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end > start:
        return text[start : end + 1]

    return text


def _looks_like_board(payload: dict[str, Any]) -> bool:
    return "columns" in payload and "cards" in payload


def parse_ai_payload(content: str, current_board: BoardData) -> AiStructuredResponse:
    json_text = extract_json_text(content)
    if not json_text:
        raise AiParseError("Invalid structured AI response")

    try:
        raw = json.loads(json_text)
    except json.JSONDecodeError as exc:
        raise AiParseError("Invalid structured AI response") from exc

    if not isinstance(raw, dict):
        raise AiParseError("Invalid structured AI response")

    if _looks_like_board(raw) and "message" not in raw:
        board = BoardData.model_validate(raw)
        validate_board(board)
        return AiStructuredResponse(
            message="Updated the board.",
            board=board,
        )

    try:
        payload = AiPayload.model_validate(raw)
    except ValidationError as exc:
        raise AiParseError("Invalid structured AI response") from exc

    message = (payload.message or "").strip() or "Done."

    if payload.operations:
        try:
            board = apply_operations(current_board, payload.operations)
        except ValueError as exc:
            raise AiParseError(str(exc)) from exc
        return AiStructuredResponse(message=message, board=board)

    if payload.board is not None:
        validate_board(payload.board)
        return AiStructuredResponse(message=message, board=payload.board)

    return AiStructuredResponse(message=message, board=None)


def run_kanban_chat(
    board: BoardData,
    history: list[ChatTurn],
    user_message: str,
) -> AiStructuredResponse:
    messages = build_messages(board, history, user_message)
    content = post_chat_completion(
        messages,
        response_format=json_object_response_format(),
    )
    return parse_ai_payload(content, board)
