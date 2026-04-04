"""Integration tests for auth and document endpoints."""
import pytest


@pytest.fixture
def registered_user(client):
    resp = client.post("/api/auth/register", json={"email": "test@example.com", "password": "pass123"})
    assert resp.status_code == 200
    return resp.json()


@pytest.fixture
def auth_headers(registered_user):
    return {"Authorization": f"Bearer {registered_user['token']}"}


# --- Auth tests ---

def test_register(client):
    resp = client.post("/api/auth/register", json={"email": "a@b.com", "password": "secret"})
    assert resp.status_code == 200
    data = resp.json()
    assert "token" in data
    assert data["email"] == "a@b.com"


def test_register_duplicate(client, registered_user):
    resp = client.post("/api/auth/register", json={"email": "test@example.com", "password": "other"})
    assert resp.status_code == 400


def test_login(client, registered_user):
    resp = client.post("/api/auth/login", json={"email": "test@example.com", "password": "pass123"})
    assert resp.status_code == 200
    assert "token" in resp.json()


def test_login_wrong_password(client, registered_user):
    resp = client.post("/api/auth/login", json={"email": "test@example.com", "password": "wrong"})
    assert resp.status_code == 401


# --- Document tests ---

def test_save_document(client, auth_headers):
    resp = client.post("/api/documents", json={
        "document_type": "Mutual Non-Disclosure Agreement",
        "title": "My NDA",
        "form_data": {"party_a": "Acme"},
    }, headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["title"] == "My NDA"
    assert data["id"] is not None


def test_save_document_invalid_type(client, auth_headers):
    resp = client.post("/api/documents", json={
        "document_type": "Fake Document Type",
        "title": "Bad",
        "form_data": {},
    }, headers=auth_headers)
    assert resp.status_code == 422


def test_list_documents(client, auth_headers):
    client.post("/api/documents", json={
        "document_type": "Mutual Non-Disclosure Agreement",
        "title": "NDA 1",
        "form_data": {},
    }, headers=auth_headers)
    resp = client.get("/api/documents", headers=auth_headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 1


def test_get_document(client, auth_headers):
    save = client.post("/api/documents", json={
        "document_type": "Mutual Non-Disclosure Agreement",
        "title": "My NDA",
        "form_data": {"party_a": "Acme"},
    }, headers=auth_headers)
    doc_id = save.json()["id"]
    resp = client.get(f"/api/documents/{doc_id}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["form_data"]["party_a"] == "Acme"


def test_get_document_other_user(client, auth_headers):
    """Users cannot access documents belonging to other users."""
    save = client.post("/api/documents", json={
        "document_type": "Mutual Non-Disclosure Agreement",
        "title": "Private",
        "form_data": {},
    }, headers=auth_headers)
    doc_id = save.json()["id"]

    other = client.post("/api/auth/register", json={"email": "other@example.com", "password": "pw"})
    other_headers = {"Authorization": f"Bearer {other.json()['token']}"}

    resp = client.get(f"/api/documents/{doc_id}", headers=other_headers)
    assert resp.status_code == 404


def test_unauthenticated_rejected(client):
    resp = client.get("/api/documents")
    assert resp.status_code in (401, 403)
