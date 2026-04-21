"""Tests for /api/assist, /api/catalog, and /api/templates endpoints."""
from unittest.mock import patch

from models import ChatResponse

# ─── /api/assist ─────────────────────────────────────────────────────────────

def _mock_chat_response():
    return ChatResponse(message="Here is your NDA.", fields={})


def test_assist_returns_response(client):
    with patch("routes.chat.chat", return_value=_mock_chat_response()):
        resp = client.post("/api/assist", json={
            "messages": [{"role": "user", "content": "Draft me an NDA"}],
            "document_type": "Mutual Non-Disclosure Agreement",
        })
    assert resp.status_code == 200
    data = resp.json()
    assert data["message"] == "Here is your NDA."


def test_assist_llm_failure_returns_500(client):
    with patch("routes.chat.chat", side_effect=Exception("LLM down")):
        resp = client.post("/api/assist", json={
            "messages": [{"role": "user", "content": "Hello"}],
            "document_type": "Mutual Non-Disclosure Agreement",
        })
    assert resp.status_code == 500


def test_assist_rate_limit(client):
    """11th request from same IP within a minute must be rejected with 429."""
    import routes.chat
    routes.chat.request_counts.clear()
    with patch("routes.chat.chat", return_value=_mock_chat_response()):
        for _ in range(10):
            resp = client.post("/api/assist", json={
                "messages": [{"role": "user", "content": "Hello"}],
                "document_type": "Mutual Non-Disclosure Agreement",
            })
            assert resp.status_code == 200

        resp = client.post("/api/assist", json={
            "messages": [{"role": "user", "content": "Hello"}],
            "document_type": "Mutual Non-Disclosure Agreement",
        })
    assert resp.status_code == 429


# ─── /api/catalog ─────────────────────────────────────────────────────────────

def test_catalog_returns_list(client):
    resp = client.get("/api/catalog")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) > 0


def test_catalog_items_have_required_fields(client):
    resp = client.get("/api/catalog")
    for item in resp.json():
        assert "name" in item
        assert "filename" in item


def test_catalog_contains_mutual_nda(client):
    resp = client.get("/api/catalog")
    names = [item["name"] for item in resp.json()]
    assert any("NDA" in name or "Non-Disclosure" in name for name in names)


# ─── /api/templates/{document_type} ──────────────────────────────────────────

def test_get_template_success(client):
    resp = client.get("/api/templates/Mutual Non-Disclosure Agreement")
    assert resp.status_code == 200
    data = resp.json()
    assert "content" in data
    assert len(data["content"]) > 0
    assert "filename" in data


def test_get_template_not_found(client):
    resp = client.get("/api/templates/Fake Document That Does Not Exist")
    assert resp.status_code == 404
