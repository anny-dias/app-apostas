import { Router } from "express";
import { requireAuth, requireConsent } from "../middlewares/auth.js";
import { z } from "zod";
import { validate } from "../middlewares/validate.js";
import { pool } from "../db.js";
import axios from "axios";

const router = Router();

const ingestSchema = z.object({
  body: z.object({
    sessions_per_week: z.number().int().min(0).max(70),
    avg_bet: z.number().min(0).max(100000),
    session_minutes: z.number().int().min(1).max(1440),
    chase_losses: z.boolean()
  })
});

router.post(
  "/ingest",
  requireAuth,
  requireConsent,
  validate(ingestSchema),
  async (req, res, next) => {
    try {
      const u = res.locals.user.userId;
      const { sessions_per_week, avg_bet, session_minutes, chase_losses } = req.body;

      await pool.query(
        "INSERT INTO core.behaviors(user_id, sessions_per_week, avg_bet, session_minutes, chase_losses) VALUES ($1,$2,$3,$4,$5)",
        [u, sessions_per_week, avg_bet, session_minutes, chase_losses]
      );

      const mlUrl = process.env.ML_URL || "http://localhost:8000";
      const { data } = await axios.post(`${mlUrl}/score`, {
        sessions_per_week,
        avg_bet,
        session_minutes,
        chase_losses,
        user_id: u
      });

      await pool.query(
        "INSERT INTO core.risk_scores(user_id, score, level) VALUES ($1,$2,$3)",
        [u, data.score, data.level]
      );

      // Intervenção: front pode ler 'level' e aplicar inibição/suporte
      res.json({ ok: true, score: data });
    } catch (e) {
      next(e);
    }
  }
);

export default router;
