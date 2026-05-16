def test_login_rejects_invalid_credentials(client):
    response = client.post(
        "/api/auth/login",
        json={"username": "user", "password": "wrong"},
    )
    assert response.status_code == 401


def test_login_and_me(client):
    login = client.post(
        "/api/auth/login",
        json={"username": "user", "password": "password"},
    )
    assert login.status_code == 200
    assert login.json() == {"username": "user"}

    me = client.get("/api/auth/me")
    assert me.status_code == 200
    assert me.json() == {"username": "user"}


def test_me_requires_session(client):
    response = client.get("/api/auth/me")
    assert response.status_code == 401


def test_logout_clears_session(client):
    client.post("/api/auth/login", json={"username": "user", "password": "password"})
    assert client.get("/api/auth/me").status_code == 200

    client.post("/api/auth/logout")
    assert client.get("/api/auth/me").status_code == 401
