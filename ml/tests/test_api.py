from app import app

def test_health():
    c = app.test_client()
    r = c.get("/health")
    assert r.status_code == 200
    assert r.get_json().get("ok") is True

def test_score_ok():
    c = app.test_client()
    payload = {
        "sessions_per_week": 5,
        "avg_bet": 30.0,
        "session_minutes": 60,
        "chase_losses": False,
        "user_id": "u-123"
    }
    r = c.post("/score", json=payload)
    j = r.get_json()
    assert r.status_code == 200
    assert "score" in j and "level" in j

def test_score_bad_request():
    c = app.test_client()
    r = c.post("/score", json={"foo": "bar"})
    assert r.status_code == 400
    j = r.get_json()
    assert j.get("error") == "BAD_REQUEST"
