# Backend (FastAPI)

Python **3.12+**, packaged with **[uv](https://docs.astral.sh/uv/)**. App package: `pm_backend`.

## Layout

- `pyproject.toml` / `uv.lock` — dependencies (`fastapi`, `uvicorn[standard]`).
- `pm_backend/main.py` — FastAPI app: API routes under `/api/*`, static frontend mounted at `/`.
- `static/` — Next.js export copied here in Docker (`frontend/out`). Locally, `frontend/out` is used when it exists.

## API

- `GET /api/health` — `{"status":"ok"}`
- `GET /api/hello` — `{"message":"Hello from FastAPI"}`
- `POST /api/auth/login` — body `{username, password}`; sets `session_id` HTTP-only cookie
- `GET /api/auth/me` — current user or `401`
- `POST /api/auth/logout` — clears session

See `docs/auth.md` for session details. MVP credentials: `user` / `password`.

## Run locally

```bash
cd frontend && npm run build
cd ../backend && uv sync
uv run uvicorn pm_backend.main:app --reload --host 127.0.0.1 --port 8000
```

## Docker

Multi-stage `Dockerfile` at repo root: builds `frontend` with Node, copies `out/` to `/app/static`, runs `uvicorn` on port **8000**.
