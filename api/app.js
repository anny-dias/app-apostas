import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookie from "cookie-parser";
import rateLimit from "express-rate-limit";
import pino from "pino";
import pinoHttp from "pino-http";

import { errorHandler } from "./middlewares/error.js";
import authRoutes from "./routes/auth.js";
import consentRoutes from "./routes/consent.js";
import behaviorRoutes from "./routes/behavior.js";

const app = express();
const logger = pino();

app.use(helmet({ crossOriginResourcePolicy: { policy: "same-site" } }));
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json({ limit: "200kb" }));
app.use(cookie());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));
app.use(
  pinoHttp({
    logger,
    redact: { paths: ['req.headers.authorization','req.headers.cookie','res.headers["set-cookie"]'] }
  })
);

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/auth", authRoutes);
app.use("/consent", consentRoutes);
app.use("/behavior", behaviorRoutes);

app.use(errorHandler);

export default app;
