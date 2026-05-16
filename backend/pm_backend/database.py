import json
import os
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

import bcrypt

BACKEND_DIR = Path(__file__).resolve().parent.parent
REPO_ROOT = BACKEND_DIR.parent
PACKAGE_SEED_PATH = Path(__file__).resolve().parent / "seed" / "board.example.json"
DOCS_SEED_PATH = REPO_ROOT / "docs" / "kanban-board.example.json"
MVP_USERNAME = "user"
MVP_PASSWORD = "password"

_SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS boards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  data_json TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_boards_user_id ON boards (user_id);
"""


def get_database_path() -> Path:
    override = os.environ.get("PM_DATABASE_PATH")
    if override:
        return Path(override)
    return BACKEND_DIR / "data" / "pm.db"


def connect() -> sqlite3.Connection:
    path = get_database_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with connect() as conn:
        conn.executescript(_SCHEMA)
        _seed_mvp_user(conn)
        conn.commit()


def _seed_mvp_user(conn: sqlite3.Connection) -> None:
    row = conn.execute(
        "SELECT id FROM users WHERE username = ?", (MVP_USERNAME,)
    ).fetchone()
    if row:
        return
    password_hash = bcrypt.hashpw(
        MVP_PASSWORD.encode(), bcrypt.gensalt()
    ).decode()
    conn.execute(
        "INSERT INTO users (username, password_hash) VALUES (?, ?)",
        (MVP_USERNAME, password_hash),
    )


def verify_user(username: str, password: str) -> int | None:
    with connect() as conn:
        row = conn.execute(
            "SELECT id, password_hash FROM users WHERE username = ?", (username,)
        ).fetchone()
    if not row:
        return None
    if not bcrypt.checkpw(password.encode(), row["password_hash"].encode()):
        return None
    return int(row["id"])


def get_username_by_id(user_id: int) -> str | None:
    with connect() as conn:
        row = conn.execute(
            "SELECT username FROM users WHERE id = ?", (user_id,)
        ).fetchone()
    return row["username"] if row else None


def load_default_board_json() -> str:
    for path in (DOCS_SEED_PATH, PACKAGE_SEED_PATH):
        if path.is_file():
            return path.read_text(encoding="utf-8")
    raise FileNotFoundError("Default board seed JSON not found")


def get_board_json(user_id: int) -> str:
    with connect() as conn:
        row = conn.execute(
            "SELECT data_json FROM boards WHERE user_id = ?", (user_id,)
        ).fetchone()
        if row:
            return row["data_json"]
        data_json = load_default_board_json()
        conn.execute(
            "INSERT INTO boards (user_id, data_json) VALUES (?, ?)",
            (user_id, data_json),
        )
        conn.commit()
        return data_json


def save_board_json(user_id: int, data_json: str) -> None:
    updated_at = datetime.now(timezone.utc).isoformat()
    with connect() as conn:
        row = conn.execute(
            "SELECT id FROM boards WHERE user_id = ?", (user_id,)
        ).fetchone()
        if row:
            conn.execute(
                "UPDATE boards SET data_json = ?, updated_at = ? WHERE user_id = ?",
                (data_json, updated_at, user_id),
            )
        else:
            conn.execute(
                "INSERT INTO boards (user_id, data_json, updated_at) VALUES (?, ?, ?)",
                (user_id, data_json, updated_at),
            )
        conn.commit()
