import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import { pool } from "../db.js";
import { z } from "zod";
import jwt from "jsonwebtoken";
import { validate } from "../middlewares/validate.js";

const router = Router();

const acceptSchema = z.object({
  body: z.object({
    version: z.string().min(1)
  })
});

router.post("/accept", requireAuth, validate(acceptSchema), async (req, res, next) => {
  try {
    const { version } = req.body;
    const u = res.locals.user.userId;

    await pool.query(
      "UPDATE core.users SET consent_accepted_at=now(), consent_version=$1 WHERE user_id=$2",
      [version, u]
    );

    await pool.query(
      "INSERT INTO core.consent_log(user_id, version, action, user_agent, ip) VALUES ($1,$2,$3,$4,$5)",
      [u, version, "ACCEPT", req.headers["user-agent"] || "", req.ip]
    );

    // Re-emitir o token já com consent=true
    const payload = { sub: u, role: res.locals.user.role, consent: true };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXP || "15m",
      audience: process.env.JWT_AUD,
      issuer: process.env.JWT_ISS,
      algorithm: "HS256"
    });

    const isProd =
      process.env.NODE_ENV === "production" ||
      (String(process.env.COOKIE_SECURE || "").toLowerCase() === "true");

    const cookieOpts = {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "strict" : "lax",
      path: "/"
    };
    if (process.env.COOKIE_DOMAIN && process.env.COOKIE_DOMAIN !== "localhost") {
      cookieOpts.domain = process.env.COOKIE_DOMAIN;
    }
    res.cookie("access_token", token, cookieOpts);

    const body = { ok: true };
    if (!isProd) body.token = token; // em dev devolve token no corpo
    return res.json(body);
  } catch (e) {
    next(e);
  }
});

router.post("/revoke", requireAuth, async (_req, res, next) => {
  try {
    const u = res.locals.user.userId;

    await pool.query(
      "UPDATE core.users SET consent_accepted_at=NULL WHERE user_id=$1",
      [u]
    );

    await pool.query(
      "INSERT INTO core.consent_log(user_id, version, action) VALUES ($1,$2,$3)",
      [u, "", "REVOKE"]
    );

    // Reemite o token sem consent
    const payload = { sub: u, role: res.locals.user.role, consent: false };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXP || "15m",
      audience: process.env.JWT_AUD,
      issuer: process.env.JWT_ISS,
      algorithm: "HS256"
    });

    const isProd =
      process.env.NODE_ENV === "production" ||
      (String(process.env.COOKIE_SECURE || "").toLowerCase() === "true");

    const cookieOpts = {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "strict" : "lax",
      path: "/"
    };
    if (process.env.COOKIE_DOMAIN && process.env.COOKIE_DOMAIN !== "localhost") {
      cookieOpts.domain = process.env.COOKIE_DOMAIN;
    }
    res.cookie("access_token", token, cookieOpts);

    const body = { ok: true };
    if (!isProd) body.token = token;
    return res.json(body);
  } catch (e) {
    next(e);
  }
});

export default router;
