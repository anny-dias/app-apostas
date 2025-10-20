import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";
import { validate } from "../middlewares/validate.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

/**
 * Registro (demo)
 * - Cria usuário em core.users e pii.users_pii
 * - Gera hash da senha (apenas demonstração; não salva em tabela própria)
 */
const regSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8)
  })
});

router.post("/register", validate(regSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    // Em projeto real, crie tabela auth.credentials e salve o hash
    const hash = await bcrypt.hash(password, 12);
    void hash; // suprime aviso eslint (hash não usado nesta demo)

    const c = await pool.connect();
    try {
      const u = await c.query(
        "INSERT INTO core.users(role) VALUES ($1) RETURNING user_id",
        ["user"]
      );
      await c.query(
        "INSERT INTO pii.users_pii(user_id, email) VALUES ($1,$2)",
        [u.rows[0].user_id, email]
      );
      res.status(201).json({ ok: true });
    } finally {
      c.release();
    }
  } catch (e) {
    next(e);
  }
});

/**
 * Login
 * - Emite JWT com exp/iss/aud
 * - Em dev: cookie sem Secure/Strict e também retorna { token } no corpo
 * - Em prod: cookie httpOnly + secure + SameSite=Strict; não retorna token no corpo
 */
const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string()
  })
});

router.post("/login", validate(loginSchema), async (req, res, next) => {
  try {
    const { email } = req.body;

    // Demo: valida apenas por e-mail; em projeto real, valide a senha com o hash salvo
    const q = await pool.query(
      `SELECT u.user_id, u.role, u.consent_accepted_at IS NOT NULL AS consent
       FROM core.users u
       JOIN pii.users_pii p ON u.user_id = p.user_id
       WHERE p.email = $1`,
      [email]
    );
    if (!q.rowCount) return res.status(401).json({ error: "INVALID_CREDENTIALS" });

    const payload = {
      sub: q.rows[0].user_id,
      role: q.rows[0].role,
      consent: q.rows[0].consent
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXP || "15m",
      audience: process.env.JWT_AUD,
      issuer: process.env.JWT_ISS,
      algorithm: "HS256"
    });

    // Cookies seguros apenas em produção
    const isProd =
      process.env.NODE_ENV === "production" ||
      (String(process.env.COOKIE_SECURE || "").toLowerCase() === "true");

    const cookieOpts = {
      httpOnly: true,
      secure: isProd,                   // em dev: false, aceita HTTP
      sameSite: isProd ? "strict" : "lax",
      path: "/"
    };

    // Evita forçar domain=localhost em dev (pode impedir o cookie de ser aceito)
    if (process.env.COOKIE_DOMAIN && process.env.COOKIE_DOMAIN !== "localhost") {
      cookieOpts.domain = process.env.COOKIE_DOMAIN;
    }

    res.cookie("access_token", token, cookieOpts);

    // Em dev, devolve também o token no corpo (para usar como Bearer no Postman)
    const body = { ok: true };
    if (!isProd) body.token = token;

    return res.json(body);
  } catch (e) {
    next(e);
  }
});

/**
 * Logout
 * - Limpa o cookie de sessão
 */
router.post("/logout", requireAuth, (_req, res) => {
  res.clearCookie("access_token", { path: "/" });
  res.json({ ok: true });
});

export default router;
