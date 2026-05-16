# Frontend (existing demo)

This package is a **Next.js 16** App Router app with **React 19**. **Auth** gates the board via `AuthGate` and `/api/auth/*`. **Kanban** loads/saves via `GET`/`PUT /api/board` (debounced save). **No AI UI** yet.

## Commands

- `npm run dev` — develop (Next dev server on port 3000).
- `npm run build` — static export to `out/` (`output: "export"` in `next.config.ts`).
- `npm run test:unit` — Vitest (files under `src/**/*.{test,spec}.{ts,tsx}`).
- `npm run test:e2e` — Playwright against **http://127.0.0.1:8000** (Docker Compose stack).
- `npm run test:all` — unit then e2e.

## Layout and entry

- `src/app/layout.tsx` — root layout; loads **Space Grotesk** and **Manrope** from `next/font/google`, applies `globals.css`.
- `src/app/page.tsx` — home page; `AuthGate` wraps `<KanbanBoard />`.
- `src/lib/api.ts` — shared `apiFetch` with credentials.
- `src/lib/auth.ts` — `fetchCurrentUser`, `login`, `logout`.
- `src/lib/board.ts` — `fetchBoard`, `saveBoard`.
- `src/components/AuthGate.tsx` — session check, login form, or children with `onLogout`.
- `src/components/LoginForm.tsx` — sign-in UI.
- `src/app/globals.css` — Tailwind v4 (`@import "tailwindcss"`), CSS variables for the product palette (aligned with root `AGENTS.md`), `body` styling.

## Data model and logic

- `src/lib/kanban.ts` — types `Card`, `Column`, `BoardData`; **`initialData`** with five fixed columns and eight seeded cards; **`moveCard`** for drag-and-drop column/card ordering; **`createId`** for new card ids. Pure functions except `createId` (random/time-based).

## Components

- `src/components/KanbanBoard.tsx` (**client**) — owns **`BoardData` state**; wraps content in **`@dnd-kit/core`** `DndContext` (`PointerSensor`, `closestCorners`); **`DragOverlay`** with `KanbanCardPreview` while dragging; handlers: drag end (`moveCard`), rename column, add card (`createId`), delete card. Marketing-style header and column summary chips. Uses `data-testid` on columns indirectly via `KanbanColumn`.
- `src/components/KanbanColumn.tsx` — **`useDroppable`** per column; column title is an **inline editable `<input>`**; **`SortableContext`** over card ids; lists `KanbanCard`; empty state; **`NewCardForm`** at bottom. `data-testid={`column-${column.id}`}`.
- `src/components/KanbanCard.tsx` — **`useSortable`** for drag; title, details, **Remove** button. `data-testid={`card-${card.id}`}`.
- `src/components/KanbanCardPreview.tsx` — read-only card chrome for overlay (no delete).
- `src/components/NewCardForm.tsx` — collapsible **Add a card** flow; requires non-empty title; optional details.

## Testing

- **Vitest** + **jsdom** + **Testing Library** (`vitest.config.ts`, `src/test/setup.ts` imports `@testing-library/jest-dom`).
  - `src/lib/kanban.test.ts` — `moveCard` (reorder same column, move column, drop on column).
  - `src/components/KanbanBoard.test.tsx` — five columns, rename column, add/remove card.
- **Playwright** (`playwright.config.ts`): `webServer` runs `docker compose up --build -d` from repo root; tests in `tests/kanban.spec.ts` (board visible, add card, drag card between columns via mouse). Run `npx playwright install chromium` once before e2e.

## Config

- `next.config.ts` — default empty options.
- `tsconfig.json` — path alias `@/*` → `src/*`.
- ESLint via `eslint-config-next`.

## Integration notes for later phases

- The UI assumes **five columns** with stable **`col-*` ids** in `initialData`; backend persistence should preserve or map these ids if the server becomes the source of truth.
- Styling is **Tailwind v4** with **CSS variables** in `globals.css`; keep new UI (e.g. auth, AI sidebar) consistent with those tokens.
- Production-like runs use the **static export** served by FastAPI at `/` (port 8000). Use `npm run dev` only for UI development.
