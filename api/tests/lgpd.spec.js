import request from "supertest";
import app from "../app.js";

describe("LGPD gates", () => {
  it("bloqueia ingest sem consentimento/autenticação", async () => {
    const r = await request(app).post("/behavior/ingest").send({
      sessions_per_week: 2,
      avg_bet: 10,
      session_minutes: 30,
      chase_losses: false
    });
    expect([401, 403]).toContain(r.status);
  });
});
