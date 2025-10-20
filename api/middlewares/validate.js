export const validate = (schema) => (req, res, next) => {
  const parsed = schema.safeParse({
    body: req.body,
    params: req.params,
    query: req.query
  });
  if (!parsed.success) return res.status(400).json({ error: "VALIDATION_ERROR" });
  next();
};
