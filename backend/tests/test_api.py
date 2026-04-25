import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert "Open-SIEM" in response.json()["message"]


def test_register_and_login():
    # Register a test user
    reg = client.post("/api/auth/register", json={
        "username": "testuser",
        "email": "test@test.com",
        "password": "testpass123",
        "role": "analyst"
    })
    assert reg.status_code in (201, 400)   # 400 if already exists

    # Login
    login = client.post("/api/auth/login", data={
        "username": "admin",
        "password": "admin123"
    })
    assert login.status_code == 200
    assert "access_token" in login.json()


def test_dashboard_requires_auth():
    response = client.get("/api/dashboard/stats")
    assert response.status_code == 401


def test_dashboard_with_auth():
    login = client.post("/api/auth/login", data={
        "username": "admin", "password": "admin123"
    })
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/dashboard/stats", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "cpu_percent" in data
    assert "severity_counts" in data
