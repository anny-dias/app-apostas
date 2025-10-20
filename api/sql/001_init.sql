
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE SCHEMA IF NOT EXISTS core;
CREATE SCHEMA IF NOT EXISTS pii;

CREATE TABLE IF NOT EXISTS core.users (
  user_id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role                  TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user','counselor','admin')),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  consent_accepted_at   TIMESTAMPTZ,
  consent_version       TEXT
);


CREATE INDEX IF NOT EXISTS idx_users_role         ON core.users(role);
CREATE INDEX IF NOT EXISTS idx_users_consent_at   ON core.users(consent_accepted_at);


CREATE TABLE IF NOT EXISTS pii.users_pii (
  user_id     UUID PRIMARY KEY REFERENCES core.users(user_id) ON DELETE CASCADE,
  email       TEXT UNIQUE NOT NULL,
  phone       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()

);

CREATE INDEX IF NOT EXISTS idx_users_pii_email ON pii.users_pii(email);


CREATE TABLE IF NOT EXISTS core.consent_log (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES core.users(user_id) ON DELETE CASCADE,
  version     TEXT NOT NULL,
  action      TEXT NOT NULL CHECK (action IN ('ACCEPT','REVOKE')),
  user_agent  TEXT,
  ip          TEXT,
  at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_consent_user_at ON core.consent_log(user_id, at DESC);

CREATE TABLE IF NOT EXISTS core.behaviors (
  id                 BIGSERIAL PRIMARY KEY,
  user_id            UUID NOT NULL REFERENCES core.users(user_id) ON DELETE CASCADE,
  sessions_per_week  INT  CHECK (sessions_per_week >= 0 AND sessions_per_week <= 70),
  avg_bet            NUMERIC(10,2) CHECK (avg_bet >= 0),
  session_minutes    INT  CHECK (session_minutes >= 1 AND session_minutes <= 1440),
  chase_losses       BOOLEAN NOT NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_behaviors_user_ts ON core.behaviors(user_id, created_at DESC);


CREATE TABLE IF NOT EXISTS core.risk_scores (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES core.users(user_id) ON DELETE CASCADE,
  score       NUMERIC(4,3) NOT NULL CHECK (score >= 0 AND score <= 1),
  level       TEXT NOT NULL CHECK (level IN ('LOW','MED','HIGH')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_risk_user_ts  ON core.risk_scores(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_risk_level_ts ON core.risk_scores(level, created_at DESC);


CREATE OR REPLACE VIEW core.user_export AS
SELECT
  u.user_id,
  u.role,
  u.created_at,
  u.consent_accepted_at,
  u.consent_version
FROM core.users u;


CREATE OR REPLACE FUNCTION core.purge_old_behavior(p_days INT DEFAULT 180)
RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
  v_count INT;
BEGIN
  DELETE FROM core.behaviors b
   WHERE b.created_at < now() - (p_days || ' days')::INTERVAL;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;
