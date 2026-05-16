from pathlib import Path
from typing import Annotated

from fastapi import Cookie, FastAPI, HTTPException, Response
from fastapi.staticfiles import StaticFiles

from pm_backend.auth import (
    LoginRequest,
    SESSION_COOKIE,
    UserResponse,
    clear_session,
    clear_session_cookie,
    create_session,
    get_username,
    set_session_cookie,
)

BACKEND_DIR = Path(__file__).resolve().parent.parent
REPO_ROOT = BACKEND_DIR.parent


def resolve_frontend_dir() -> Path:
    candidates = (
        BACKEND_DIR / "static",
        REPO_ROOT / "frontend" / "out",
    )
    for path in candidates:
        if (path / "index.html").is_file():
            return path
    return candidates[0]


FRONTEND_DIR = resolve_frontend_dir()

app = FastAPI(title="PM Kanban API")


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/hello")
def hello() -> dict[str, str]:
    return {"message": "Hello from FastAPI"}


@app.post("/api/auth/login", response_model=UserResponse)
def login(body: LoginRequest, response: Response) -> UserResponse:
    if body.username != "user" or body.password != "password":
        raise HTTPException(status_code=401, detail="Invalid credentials")
    session_id = create_session(body.username)
    set_session_cookie(response, session_id)
    return UserResponse(username=body.username)


@app.get("/api/auth/me", response_model=UserResponse)
def me(
    session_id: Annotated[str | None, Cookie(alias=SESSION_COOKIE)] = None,
) -> UserResponse:
    username = get_username(session_id)
    if not username:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return UserResponse(username=username)


@app.post("/api/auth/logout")
def logout(
    response: Response,
    session_id: Annotated[str | None, Cookie(alias=SESSION_COOKIE)] = None,
) -> dict[str, bool]:
    clear_session(session_id)
    clear_session_cookie(response)
    return {"ok": True}


app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")
