from flask import Flask, request, jsonify

app = Flask(__name__)

@app.get("/health")
def health():
    return jsonify(ok=True)

def _score(d: dict) -> float:
    """
    Heurística simples 0..1 para demonstração:
      - sessões/semana (peso 0.35, normalizado em 21)
      - minutos/sessão (0.25, normalizado em 240)
      - valor médio da aposta (0.25, normalizado em 1000)
      - chase_losses (0.15, 0 ou 1)
    """
    s = (
        (max(0, min(d["sessions_per_week"], 70)) / 21) * 0.35
        + (max(1, min(d["session_minutes"], 1440)) / 240) * 0.25
        + (max(0.0, min(float(d["avg_bet"]), 100000.0)) / 1000.0) * 0.25
        + (1.0 if bool(d["chase_losses"]) else 0.0) * 0.15
    )
    return round(min(1.0, s), 3)

def _validate_payload(payload: dict) -> tuple[bool, str]:
    required = ["sessions_per_week", "avg_bet", "session_minutes", "chase_losses", "user_id"]
    missing = [k for k in required if k not in payload]
    if missing:
        return False, f"missing fields: {', '.join(missing)}"
    try:
        int(payload["sessions_per_week"])
        float(payload["avg_bet"])
        int(payload["session_minutes"])
        bool(payload["chase_losses"])
        str(payload["user_id"])
    except Exception:
        return False, "invalid types"
    return True, ""

@app.post("/score")
def score():
    payload = request.get_json(silent=True) or {}
    ok, msg = _validate_payload(payload)
    if not ok:
        return jsonify(error="BAD_REQUEST", detail=msg), 400

    s = _score(payload)
    level = "LOW" if s < 0.33 else "MED" if s < 0.66 else "HIGH"
    # Importante: NÃO usamos PII aqui. user_id é apenas um identificador técnico.
    return jsonify(score=s, level=level)

if __name__ == "__main__":
    # Executa em 0.0.0.0 para funcionar no Docker
    app.run(host="0.0.0.0", port=8000)
