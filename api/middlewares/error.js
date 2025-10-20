import { randomUUID } from "crypto";

export function errorHandler(err, _req, res, _next) {
  const id = randomUUID();
  console.error(`[${id}]`, err); // log interno
  res.status(500).json({ error: "INTERNAL_ERROR", id }); // resposta sem stack/segredos
}
