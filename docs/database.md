# Database design (MVP)

SQLite database file: `backend/data/pm.db` (created on first run in Part 6). One file, no external server.

## Approach: users in tables, board state as JSON

| Choice | Decision | Why |
|--------|----------|-----|
| Users | Normalized `users` table | Supports multiple users later; login maps to `user_id`. |
| Board layout | Single JSON document per board | Matches frontend `BoardData` (`frontend/src/lib/kanban.ts`); no translation layer for Part 7. |
| Columns / cards | Inside JSON, not separate tables | MVP has fixed column **ids** with renamable **titles**; order is `cardIds` arrays. |

A **hybrid** model: relational ownership (`users` → `boards`), document payload (`data_json`).

## Entities

### `users`

| Column | Type | Notes |
|--------|------|-------|
| `id` | INTEGER PK | Internal id. |
| `username` | TEXT UNIQUE | e.g. `user`. |
| `password_hash` | TEXT | Bcrypt (or similar) of password; MVP seeds one row. |

### `boards`

| Column | Type | Notes |
|--------|------|-------|
| `id` | INTEGER PK | |
| `user_id` | INTEGER UNIQUE FK → `users.id` | **One board per user** for MVP. |
| `data_json` | TEXT NOT NULL | Serialized `BoardData` (see below). |
| `updated_at` | TEXT | ISO timestamp; set on each write. |

## Board JSON shape (`BoardData`)

Same as the frontend:

```json
{
  "columns": [
    { "id": "col-backlog", "title": "Backlog", "cardIds": ["card-1", "card-2"] }
  ],
  "cards": {
    "card-1": { "id": "card-1", "title": "...", "details": "..." }
  }
}
```

- **Column ids** (`col-backlog`, etc.) are stable keys; the UI may rename **title** only.
- **Card ids** are opaque strings (e.g. `card-abc123` from `createId()`).
- **Column order** is the order of objects in the `columns` array (five fixed columns for MVP).
- **Card order within a column** is the order of strings in that column’s `cardIds` array.

Artifacts in this repo:

- `docs/kanban-board.schema.json` — JSON Schema for validation.
- `docs/kanban-board.example.json` — example seed payload (matches demo board).
- `docs/schema.sql` — SQLite DDL and seed notes.

## How UI actions map to storage

| UI action | JSON update |
|-----------|-------------|
| Rename column | Set `columns[i].title` for matching `columns[i].id`. |
| Reorder card in column | Reorder `cardIds` within that column. |
| Move card to another column | Remove id from source `cardIds`, insert into target `cardIds` (index = drop position). |
| Add card | Add object to `cards`; append id to column `cardIds`. |
| Delete card | Delete key from `cards`; remove id from owning column `cardIds`. |

Full board updates (Part 6 API) may replace entire `data_json` or apply a patch; MVP can use **replace whole document** on each save for simplicity.

## API linkage (Part 6+)

- Authenticated `user_id` from session → load `boards` row where `user_id` matches.
- If no row exists, insert board with `docs/kanban-board.example.json` as initial `data_json`.
- `GET /api/board` → parse `data_json` to `BoardData`.
- `PUT /api/board` → validate against schema, store `data_json`, bump `updated_at`.

## Sign-off

- [x] Owner approves this design before Part 6 implementation.
