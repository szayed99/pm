import pytest
from fastapi.testclient import TestClient

from pm_backend import auth
from pm_backend.database import init_db
from pm_backend.main import app


@pytest.fixture(autouse=True)
def clear_sessions():
    auth._sessions.clear()
    yield
    auth._sessions.clear()


@pytest.fixture()
def db_path(tmp_path, monkeypatch):
    path = tmp_path / "test.db"
    monkeypatch.setenv("PM_DATABASE_PATH", str(path))
    return path


@pytest.fixture()
def client(db_path):
    init_db()
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture()
def auth_client(client):
    response = client.post(
        "/api/auth/login",
        json={"username": "user", "password": "password"},
    )
    assert response.status_code == 200
    return client
