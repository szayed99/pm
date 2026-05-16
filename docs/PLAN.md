# Project execution plan

Agents should **check off checklist items** as they complete them. The project owner should **approve** the plan before heavy execution (Part 2 onward); record approval by checking the item in Part 1 or in commit/PR notes.

Open product decisions (auth shape, JSON storage shape, chat history) can stay **decided at implementation time**; each part below flags where a short `docs/` note may be required after the choice is made.

---

## Part 1: Plan

**Goal:** Detailed roadmap, documented frontend, and stakeholder sign-off.

### Checklist

- [x] Enrich this document with substeps, tests, and success criteria for every part (2 through 10).
- [x] Add `frontend/AGENTS.md` describing the existing Next.js Kanban demo.
- [x] **User approves this plan** before starting Part 2 (Scaffolding).

### Tests

- N/A (documentation-only); verify manually that links and file paths in this doc match the repo.

### Success criteria

- [x] `docs/PLAN.md` contains actionable checklists for Parts 2 to 10.
- [x] `frontend/AGENTS.md` accurately reflects current `frontend/` structure and behavior.
- [x] User has explicitly approved proceeding (checkbox above).

---

## Part 2: Scaffolding

**Goal:** Docker image, `backend/` FastAPI app, `scripts/` start/stop for Mac / Windows / Linux, proving static HTML at `/` and a working API call from that page (or equivalent demo).

### Checklist

- [x] Add `Dockerfile` (and `docker-compose.yml` if useful) using **`uv`** for Python dependencies as specified in root `AGENTS.md`.
- [x] Create `backend/` with FastAPI app entrypoint; minimal route(s), e.g. `GET /api/health` or `GET /api/hello`.
- [x] Serve **example static HTML** at `/` from FastAPI (or documented static mount) that loads and triggers **one successful API call** (e.g. fetch JSON and display it).
- [x] Add `scripts/` with **start** and **stop** scripts for **macOS**, **Windows**, and **Linux** (consistent behavior: build/run container or local processes as documented in README).
- [x] Document in root `README.md` (minimal) how to run: prerequisites, one command to start, one to stop.

### Tests

- [x] **Manual / smoke:** From a clean machine, run start script; open `/` and confirm HTML + API response visible or logged.
- [ ] **Optional CI-friendly:** Script or `docker compose` healthcheck that curls `/` and `/api/...` (add only if simple).

### Success criteria

- One container (or documented compose stack) runs locally and serves `/` with a hello-style page.
- The same process exposes a JSON API the page (or instructions) verifies.
- Start/stop scripts work on all three OS families without undocumented steps.

---

## Part 3: Add in Frontend

**Goal:** **Static build** of the Next.js app is produced and **served at `/`** by FastAPI; Kanban demo is the main UI; **unit + integration** tests remain green; add coverage where the integration surface changes.

### Checklist

- [x] Configure Next.js for **static export** (or equivalent) suitable for serving from FastAPI at `/` (resolve `assetPrefix` / `basePath` if needed).
- [x] Wire FastAPI to serve the built `out/` (or chosen output dir) for non-API routes; keep API under e.g. `/api`.
- [x] Update Docker build to **build frontend + backend** in correct order.
- [x] Update `frontend` test commands if paths or server assumptions change (e.g. Playwright `baseURL` / `webServer`).
- [x] Run and fix **`npm run test:unit`** and **`npm run test:e2e`** (or adjusted equivalents) after integration.

### Tests

- [x] `npm run test:unit` (Vitest) — all passing.
- [x] `npm run test:e2e` (Playwright) — all passing against the **integrated** server (update config if dev server is no longer the target).
- [x] **Manual:** Load `/`, Kanban visible, drag/add/rename still work.

### Success criteria

- Production-like run serves the real Kanban UI at `/`, not placeholder HTML.
- API routes still reachable and documented.
- Unit + e2e tests cover critical paths with no regressions.

---

## Part 4: Fake user sign-in

**Goal:** Visiting `/` requires **dummy login** (`user` / `password`); after login, Kanban is visible; **logout** returns to login. Comprehensive **frontend (and e2e)** tests.

### Checklist

- [x] Add a minimal **login screen** (same origin; no real identity provider).
- [x] Persist session in a way consistent with later API auth (cookie, header, or session store — **document the choice** in `docs/` in one short paragraph).
- [x] Gate `KanbanBoard` (or main layout) behind authenticated state; implement **logout**.
- [x] Keep styling aligned with `globals.css` / `AGENTS.md` palette.
- [x] Update Playwright and Vitest coverage for login, failed login, logout, and board access.

### Tests

- [x] Unit/integration: invalid credentials, valid credentials, logout.
- [x] E2e: full flow from cold `/` to board and back to logged-out state.

### Success criteria

- Wrong credentials never show the board; correct credentials do.
- Refresh behavior is defined and tested (session persists or not — behavior documented).
- All auth-related tests pass in CI/local `test:all`.

---

## Part 5: Database modeling

**Goal:** Propose and **document** a **SQLite** schema for Kanban + users; persist schema or example payload **as JSON** (e.g. `docs/kanban-schema.json` or embedded in doc); **user sign-off** on approach.

### Checklist

- [x] Add `docs/` write-up: entities (user, board, columns, cards), keys, and how JSON fits (e.g. board blob vs normalized tables — **choose and justify briefly**).
- [x] Check in a **JSON artifact** (schema shape, OpenAPI-style example, or migration seed) as agreed.
- [x] Note how **column rename** and **card order** map to storage.
- [x] **User sign-off:** checklist item or comment that owner approved the doc.

### Tests

- N/A for DB file itself; optional validation script that parses the JSON artifact.

### Success criteria

- [x] A new contributor can implement Part 6 from the doc without guessing the data model.
- [x] Owner explicitly approves the documented approach.

---

## Part 6: Backend CRUD

**Goal:** FastAPI routes **read and mutate** the Kanban for a **given user**; SQLite **created if missing**; thorough **backend unit tests** (pytest or stdlib — **pick one, stay consistent**).

### Checklist

- [x] DB bootstrap on startup (create file, run migrations or `CREATE TABLE IF NOT EXISTS`).
- [x] Implement routes aligned with Part 5 doc (e.g. `GET/PATCH` board, or finer-grained endpoints — match the doc).
- [x] Map authenticated user (Part 4) to **one board per user** for MVP.
- [x] No secrets in repo; use `.env` for keys only where needed later.
- [x] `backend/` tests with in-memory or temp-file SQLite.

### Tests

- [x] Unit tests for all public API behaviors: empty board, seed, rename column, move card, add/delete card, unauthorized access if applicable.

### Success criteria

- API alone (curl or test client) can perform full Kanban lifecycle for a test user.
- DB file appears when absent; tests do not require manual setup.

---

## Part 7: Frontend + Backend

**Goal:** Frontend uses **real API** for board load/save; persistence matches server; **thorough** tests (frontend + contract/e2e).

### Checklist

- [x] Replace local-only `useState` persistence with **load on mount** and **mutations** via API (optimistic UI optional; keep MVP simple).
- [x] Handle loading and error states minimally (user-visible or logged).
- [x] Ensure drag/rename/add/delete **persist** across refresh and container restart.
- [x] Update e2e to run against stack with API + DB (or mocked per test strategy — **prefer real integration** for MVP).

### Tests

- [x] Frontend unit tests for API client or hooks if introduced.
- [x] E2e: login, change board, refresh, assert persistence.

### Success criteria

- Same user sees the same board after reload and after restart (DB volume or documented persistence path).
- Test suite catches broken API wiring.

---

## Part 8: AI connectivity

**Goal:** Backend calls **OpenRouter** with **`OPENROUTER_API_KEY`** from `.env`; model per root `AGENTS.md`; **automated** “**2+2**” (or equivalent) check proves connectivity.

### Checklist

- [ ] HTTP client in backend for OpenRouter; read model name from config/env.
- [ ] Dedicated test or script gated on env var presence (skip in CI without key, or use recorded mock — **document**).
- [ ] No key committed; document required env in README.

### Tests

- [ ] Backend test or integration script: when `OPENROUTER_API_KEY` is set, assertion on response shape or content for trivial prompt.

### Success criteria

- With a valid key, one command proves the model responds.
- Without a key, test suite still passes (skipped or mocked).

---

## Part 9: AI + Kanban structured output

**Goal:** Backend sends **Kanban JSON + user message + conversation history** to the model; response uses **structured output** (schema-defined) containing **assistant text** and **optional board update**; thorough tests (mock LLM or snapshot).

### Checklist

- [ ] Define response schema (JSON Schema or FastAPI/Pydantic model) for “message + optional patch / full board”.
- [ ] Implement prompt assembly: board snapshot, history, user query.
- [ ] Parse model output safely; reject malformed with clear API error.
- [ ] Tests with **mocked** OpenRouter responses for: text-only, text + board update, invalid payload.

### Tests

- [ ] Unit tests for prompt builder and response parser.
- [ ] Integration test with mock HTTP layer for OpenRouter.

### Success criteria

- API returns structured result; board mutation intent is representable in one response type.
- Tests do not call the real API by default.

---

## Part 10: AI sidebar UI

**Goal:** **Sidebar** chat UI (polished, on-brand); sends messages to backend; when response includes board updates, **UI refreshes** from server (or applies patch); full **e2e** path optional if heavy, minimum **integration** tests.

### Checklist

- [ ] Sidebar component: message list, input, send, loading state.
- [ ] Wire to Part 9 endpoint; display errors sanely.
- [ ] On structured board update: **refetch** board or apply returned patch; Kanban reflects changes **without manual refresh**.
- [ ] Respect login gate (Part 4).
- [ ] Visual polish: spacing, typography, colors from `globals.css`.

### Tests

- [ ] Component tests for sidebar behavior with mocked fetch.
- [ ] E2e: login, send message (stub backend or test env) and assert board updates — **or** document Playwright stub strategy.

### Success criteria

- User can hold a multi-turn chat and see Kanban updates when the model returns them.
- Board state stays consistent with server after AI-driven changes.

---

## Dependency overview (reference)

| Part | Delivers |
|------|----------|
| 2 | Docker, FastAPI shell, scripts |
| 3 | Static Next at `/` |
| 4 | Fake auth |
| 5 | DB + JSON documentation |
| 6 | Persisted API |
| 7 | Wired frontend |
| 8 | Live OpenRouter ping |
| 9 | Structured AI + board |
| 10 | Chat sidebar + refresh |
