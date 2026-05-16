from contextlib import asynccontextmanager
from pathlib import Path
from typing import Annotated

from fastapi import Cookie, Depends, FastAPI, HTTPException, Response
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from pm_backend.ai import AiError, complete_chat, math_smoke_prompt, reply_contains_four
from pm_backend.ai_chat import AiParseError, ChatTurn, run_kanban_chat
from pm_backend.auth import (
    LoginRequest,
    SESSION_COOKIE,
    UserResponse,
    clear_session,
    clear_session_cookie,
    create_session,
    get_user_id,
    set_session_cookie,
)
from pm_backend.board import get_board, save_board
from pm_backend.config import get_openrouter_model
from pm_backend.database import get_username_by_id, init_db, verify_user
from pm_backend.deps import require_user_id
from pm_backend.models import BoardData

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


@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_db()
    yield


app = FastAPI(title="PM Kanban API", lifespan=lifespan)


class AiTestRequest(BaseModel):
    prompt: str | None = None


class AiTestResponse(BaseModel):
    model: str
    prompt: str
    reply: str
    ok: bool


class AiChatRequest(BaseModel):
    message: str
    history: list[ChatTurn] = []


class AiChatResponse(BaseModel):
    message: str
    board: BoardData | None = None


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/hello")
def hello() -> dict[str, str]:
    return {"message": "Hello from FastAPI"}


@app.post("/api/auth/login", response_model=UserResponse)
def login(body: LoginRequest, response: Response) -> UserResponse:
    user_id = verify_user(body.username, body.password)
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    session_id = create_session(user_id)
    set_session_cookie(response, session_id)
    return UserResponse(username=body.username)


@app.get("/api/auth/me", response_model=UserResponse)
def me(
    session_id: Annotated[str | None, Cookie(alias=SESSION_COOKIE)] = None,
) -> UserResponse:
    user_id = get_user_id(session_id)
    if user_id is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    username = get_username_by_id(user_id)
    if username is None:
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


@app.get("/api/board", response_model=BoardData)
def read_board(user_id: Annotated[int, Depends(require_user_id)]) -> BoardData:
    return get_board(user_id)


@app.put("/api/board", response_model=BoardData)
def update_board(
    board: BoardData,
    user_id: Annotated[int, Depends(require_user_id)],
) -> BoardData:
    try:
        return save_board(user_id, board)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@app.post("/api/ai/chat", response_model=AiChatResponse)
def ai_chat(
    body: AiChatRequest,
    user_id: Annotated[int, Depends(require_user_id)],
) -> AiChatResponse:
    board = get_board(user_id)
    try:
        result = run_kanban_chat(board, body.history, body.message)
    except AiParseError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except AiError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    saved_board = None
    if result.board is not None:
        saved_board = save_board(user_id, result.board)

    return AiChatResponse(message=result.message, board=saved_board)


@app.post("/api/ai/test", response_model=AiTestResponse)
def ai_test(
    body: AiTestRequest,
    _user_id: Annotated[int, Depends(require_user_id)],
) -> AiTestResponse:
    prompt = body.prompt or math_smoke_prompt()
    try:
        reply = complete_chat(prompt)
    except AiError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    return AiTestResponse(
        model=get_openrouter_model(),
        prompt=prompt,
        reply=reply,
        ok=reply_contains_four(reply) if prompt == math_smoke_prompt() else True,
    )


app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")
