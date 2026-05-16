# Authentication (MVP)

Sign-in uses a **server-side session** with an **HTTP-only cookie** (`session_id`).

- **Login:** `POST /api/auth/login` with JSON `{ "username", "password" }`. On success the API sets the cookie (7-day max age, `SameSite=Lax`, path `/`).
- **Session check:** `GET /api/auth/me` returns `{ "username" }` or `401`.
- **Logout:** `POST /api/auth/logout` clears the cookie and server session.

Credentials for the MVP user are stored in SQLite (`users` table): username `user`, password `password` (bcrypt hash). Sessions are stored in memory on the server (sufficient for local Docker; not for multi-instance production).

**Refresh:** After a successful login, reloading `/` keeps you signed in until the cookie expires or you log out.

**Users in DB (Part 6+):** Sessions stay in memory for now; `users` / `boards` tables are defined in `docs/database.md` and will back login and persisted Kanban data.
