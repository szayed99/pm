# AI (OpenRouter)

## Configuration

Repo root `.env` (gitignored):

- `OPENROUTER_API_KEY` — required for live calls
- `OPENROUTER_MODEL` — optional; default `nex-agi/nex-n2.5-pro:free`

Docker Compose loads `.env` via `env_file`.

## API

`POST /api/ai/test` (authenticated, session cookie)

- Body: `{}` for default 2+2 smoke prompt, or `{"prompt": "..."}`.
- Response: `{ "model", "prompt", "reply", "ok" }` where `ok` checks for `4` on the default prompt.

`POST /api/ai/chat` (authenticated)

- Body: `{ "message": "...", "history": [{ "role": "user"|"assistant", "content": "..." }] }`
- Sends current board JSON, history, and the user message to OpenRouter with **JSON schema** structured output.
- Response: `{ "message": "...", "board": BoardData | null }`. If `board` is present and valid, it is saved to SQLite for the user.

Schema: `docs/ai-chat-schema.json` (board shape matches `docs/kanban-board.schema.json`).

## UI (Part 10)

Signed-in users see **Board chat** in the right sidebar. Messages call `POST /api/ai/chat`; when the response includes `board`, the Kanban updates immediately (also persisted on the server).

## Tests

- `backend/tests/test_ai.py` — mocked HTTP; always runs.
- `backend/tests/test_ai_live.py` — real OpenRouter call; **skipped** when `OPENROUTER_API_KEY` is unset.

## Manual check

```bash
cd backend && uv sync --extra dev && uv run python ../scripts/ai_ping.py
```
