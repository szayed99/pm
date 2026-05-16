# Scripts

Cross-platform helpers for the Docker Compose stack (repo root).

| Script | OS |
|--------|-----|
| `start.sh` / `stop.sh` | macOS, Linux (bash) |
| `start.ps1` / `stop.ps1` | Windows (PowerShell) |

Each script `cd`s to the repository root and runs `docker compose up --build -d` or `docker compose down`.
