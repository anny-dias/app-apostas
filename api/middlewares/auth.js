import jwt from "jsonwebtoken";
import { pool } from "../db.js";

export function requireAuth(req, res, next) {
  let token = null;

  // 1) Bearer <token> (Postman / front)
  const auth = req.headers.authorization || req.headers.Authorization;
  if (auth && auth.startsWith("Bearer ")) {
    token = auth.slice(7);
  }

  // 2) Cookie (browser / Postman cookie jar)
  if (!token && req.cookies?.access_token) {
    token = req.cookies.access_token;
  }

  if (!token) return res.status(401).json({ error: "UNAUTHENTICATED" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, {
      audience: process.env.JWT_AUD,
      issuer: process.env.JWT_ISS
    });
    res.locals.user = {
      userId: payload.sub,
      role: payload.role,
      // deixe esse campo informativo; a checagem verdadeira é no DB (requireConsent)
      consentAccepted: !!payload.consent
    };
    return next();
  } catch {
    return res.status(401).json({ error: "INVALID_TOKEN" });
  }
}

export async function requireConsent(_req, res, next) {
  const u = res.locals.user;
  if (!u?.userId) return res.status(401).json({ error: "UNAUTHENTICATED" });
  try {
    const r = await pool.query(
      "SELECT consent_accepted_at FROM core.users WHERE user_id=$1",
      [u.userId]
    );
    const accepted = !!(r.rowCount && r.rows[0].consent_accepted_at);
    if (!accepted) return res.status(403).json({ error: "CONSENT_REQUIRED" });
    return next();
  } catch (e) {
    return next(e);
  }
}

// Mantém se você usar RBAC
export const requireRole = (...roles) => (_req, res, next) => {
  const u = res.locals.user;
  if (!u || !roles.includes(u.role)) return res.status(403).json({ error: "FORBIDDEN" });
  next();
};
