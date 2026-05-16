import copy

from pm_backend.database import get_board_json, init_db


def test_board_requires_auth(client):
    response = client.get("/api/board")
    assert response.status_code == 401


def test_get_board_seeds_default(auth_client):
    response = auth_client.get("/api/board")
    assert response.status_code == 200
    data = response.json()
    assert len(data["columns"]) == 5
    assert "card-1" in data["cards"]


def test_put_board_persists(auth_client, db_path):
    board = auth_client.get("/api/board").json()
    board["columns"][0]["title"] = "Renamed backlog"
    board["cards"]["card-1"]["title"] = "Updated card"

    put = auth_client.put("/api/board", json=board)
    assert put.status_code == 200
    assert put.json()["columns"][0]["title"] == "Renamed backlog"

    again = auth_client.get("/api/board")
    assert again.json()["columns"][0]["title"] == "Renamed backlog"
    assert again.json()["cards"]["card-1"]["title"] == "Updated card"

    init_db()
    raw = get_board_json(1)
    assert "Renamed backlog" in raw


def test_move_card_between_columns(auth_client):
    board = auth_client.get("/api/board").json()
    board["columns"][0]["cardIds"] = ["card-2"]
    board["columns"][1]["cardIds"] = ["card-3", "card-1"]

    auth_client.put("/api/board", json=board)
    saved = auth_client.get("/api/board").json()
    assert saved["columns"][1]["cardIds"] == ["card-3", "card-1"]


def test_add_and_delete_card(auth_client):
    board = auth_client.get("/api/board").json()
    board["cards"]["card-new"] = {
        "id": "card-new",
        "title": "New task",
        "details": "Details",
    }
    board["columns"][0]["cardIds"].append("card-new")

    auth_client.put("/api/board", json=board)
    saved = auth_client.get("/api/board").json()
    assert "card-new" in saved["cards"]

    saved["cards"].pop("card-new")
    saved["columns"][0]["cardIds"] = [
        cid for cid in saved["columns"][0]["cardIds"] if cid != "card-new"
    ]
    auth_client.put("/api/board", json=saved)
    final = auth_client.get("/api/board").json()
    assert "card-new" not in final["cards"]


def test_put_rejects_invalid_board(auth_client):
    board = auth_client.get("/api/board").json()
    broken = copy.deepcopy(board)
    broken["columns"][0]["cardIds"] = ["missing-card-id"]

    response = auth_client.put("/api/board", json=broken)
    assert response.status_code == 422


def test_board_persists_across_sessions(client):
    client.post("/api/auth/login", json={"username": "user", "password": "password"})
    board = client.get("/api/board").json()
    board["columns"][0]["title"] = "Persisted title"
    client.put("/api/board", json=board)

    client.post("/api/auth/logout")
    client.post("/api/auth/login", json={"username": "user", "password": "password"})
    again = client.get("/api/board").json()
    assert again["columns"][0]["title"] == "Persisted title"
