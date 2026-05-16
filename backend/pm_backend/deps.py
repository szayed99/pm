from typing import Annotated

from fastapi import Cookie, HTTPException

from pm_backend.auth import SESSION_COOKIE, get_user_id


def require_user_id(
    session_id: Annotated[str | None, Cookie(alias=SESSION_COOKIE)] = None,
) -> int:
    user_id = get_user_id(session_id)
    if user_id is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user_id
