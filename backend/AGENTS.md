# Backend (FastAPI)

Python **3.12+**, packaged with **[uv](https://docs.astral.sh/uv/)**. App package: `pm_backend`.

## Layout

- `pyproject.toml` / `uv.lock` — dependencies (`fastapi`, `uvicorn[standard]`).
- `pm_backend/main.py` — FastAPI app: API routes under `/api/*`, static frontend mounted at `/`.
- `static/` — Next.js export copied here in Docker (`frontend/out`). Locally, `frontend/out` is used when it exists.

## API

- `GET /api/health` — `{"status":"ok"}`
- `GET /api/hello` — `{"message":"Hello from FastAPI"}`
- `POST /api/auth/login` — body `{username, password}`; sets `session_id` HTTP-only cookie (verified against SQLite `users`)
- `GET /api/auth/me` — current user or `401`
- `POST /api/auth/logout` — clears session
- `GET /api/board` — authenticated; returns `BoardData` JSON (seeds on first read)
- `PUT /api/board` — authenticated; replaces board document
- `POST /api/ai/test` — authenticated; OpenRouter smoke call (default prompt: 2+2)
- `POST /api/ai/chat` — authenticated; Kanban-aware chat with structured `{ message, board }` response

OpenRouter: `OPENROUTER_API_KEY` and optional `OPENROUTER_MODEL` from repo `.env` (see `pm_backend/config.py`, `pm_backend/ai.py`). Live test: `uv run pytest tests/test_ai_live.py` (skipped without key).

See `docs/auth.md` and `docs/database.md`. MVP credentials: `user` / `password`. DB file: `backend/data/pm.db` (override with `PM_DATABASE_PATH`).

## Tests

From `backend/`:

```bash
uv sync --extra dev
uv run pytest
```

## Run locally

```bash
cd frontend && npm run build
cd ../backend && uv sync
uv run uvicorn pm_backend.main:app --reload --host 127.0.0.1 --port 8000
```

## Docker

Multi-stage `Dockerfile` at repo root: builds `frontend` with Node, copies `out/` to `/app/static`, runs `uvicorn` on port **8000**.
