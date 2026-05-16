import os
from pathlib import Path

from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parent.parent
REPO_ROOT = BACKEND_DIR.parent

load_dotenv(REPO_ROOT / ".env")

DEFAULT_OPENROUTER_MODEL = "openai/gpt-oss-120b:free"


def get_openrouter_api_key() -> str | None:
    value = os.environ.get("OPENROUTER_API_KEY", "").strip()
    return value or None


def get_openrouter_model() -> str:
    return os.environ.get("OPENROUTER_MODEL", DEFAULT_OPENROUTER_MODEL).strip()
