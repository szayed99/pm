# PM Kanban MVP

Stack: Next.js frontend (static export), FastAPI backend, Docker.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) with Compose v2

## Run (Docker)

**macOS / Linux** (bash). If `./scripts/start.sh` is permission denied, run `chmod +x scripts/*.sh` once.

```bash
./scripts/start.sh
```

**Windows** (PowerShell):

```powershell
.\scripts\start.ps1
```

Open [http://localhost:8000](http://localhost:8000). Sign in with username `user` and password `password`.

API: `GET /api/health`, `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout`, `GET /api/board`, `PUT /api/board` (board endpoints require the session cookie).

Stop:

```bash
./scripts/stop.sh
```

```powershell
.\scripts\stop.ps1
```

## Backend only (local)

Python 3.12+ and [uv](https://docs.astral.sh/uv/). Build the frontend once, then run the API:

```bash
cd frontend && npm ci && npm run build
cd ../backend && uv sync
uv run uvicorn pm_backend.main:app --reload --host 127.0.0.1 --port 8000
```

The server serves `frontend/out/` when present, otherwise `backend/static/` (populated in Docker).

## Frontend tests

From `frontend/`:

```bash
npm run test:unit
npx playwright install chromium   # first time only
npm run test:e2e                  # starts Docker if needed, tests on :8000
```

## Backend tests

From `backend/` (requires [uv](https://docs.astral.sh/uv/)):

```bash
uv sync --extra dev
uv run pytest
```

## Configuration

API keys (e.g. OpenRouter) go in `.env` at the repo root (gitignored). Not required until the AI parts.

SQLite database is created at `backend/data/pm.db` on first run (Docker uses a `pm-data` volume at `/app/data/pm.db`). Board changes persist after refresh when signed in.
