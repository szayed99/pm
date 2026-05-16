import secrets

from fastapi import Response
from pydantic import BaseModel

SESSION_COOKIE = "session_id"
SESSION_MAX_AGE = 60 * 60 * 24 * 7

_sessions: dict[str, int] = {}


class LoginRequest(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    username: str


def create_session(user_id: int) -> str:
    session_id = secrets.token_urlsafe(32)
    _sessions[session_id] = user_id
    return session_id


def get_user_id(session_id: str | None) -> int | None:
    if not session_id:
        return None
    return _sessions.get(session_id)


def clear_session(session_id: str | None) -> None:
    if session_id and session_id in _sessions:
        del _sessions[session_id]


def set_session_cookie(response: Response, session_id: str) -> None:
    response.set_cookie(
        key=SESSION_COOKIE,
        value=session_id,
        httponly=True,
        samesite="lax",
        max_age=SESSION_MAX_AGE,
        path="/",
    )


def clear_session_cookie(response: Response) -> None:
    response.delete_cookie(key=SESSION_COOKIE, path="/")
