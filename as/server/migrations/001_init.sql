-- AS: esquema inicial (PostgreSQL). Dados de saude sao sensiveis (LGPD).
CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE IF NOT EXISTS schema_migrations (
  name TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email CITEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name TEXT,
  timezone TEXT NOT NULL DEFAULT 'America/Fortaleza',
  onboarding_ack_at TIMESTAMPTZ,          -- usuario confirmou ter lido os limites da AS
  memory_enabled BOOLEAN NOT NULL DEFAULT false, -- memoria desligada por padrao
  low_energy_mode BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Guardamos apenas o HASH do token da sessao; o token real vai so no cookie.
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  user_agent TEXT
);
CREATE INDEX sessions_user_idx ON sessions(user_id);

-- Consentimentos especificos, versionados e revogaveis.
CREATE TABLE consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purpose TEXT NOT NULL,            -- ex.: 'ai_processing', 'memory_health'
  document_version TEXT NOT NULL,
  granted BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX consents_user_purpose_idx ON consents(user_id, purpose, created_at DESC);

CREATE TABLE memory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('preference','routine','health')),
  content TEXT NOT NULL,
  use_for_personalization BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX memory_user_idx ON memory_items(user_id);

CREATE TABLE checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  wellbeing SMALLINT CHECK (wellbeing BETWEEN 1 AND 5),
  sleep_quality SMALLINT CHECK (sleep_quality BETWEEN 1 AND 5),
  energy SMALLINT CHECK (energy BETWEEN 1 AND 5),
  mood SMALLINT CHECK (mood BETWEEN 1 AND 5),
  hydration_glasses SMALLINT CHECK (hydration_glasses BETWEEN 0 AND 30),
  physical_activity_minutes SMALLINT CHECK (physical_activity_minutes BETWEEN 0 AND 1440),
  note TEXT CHECK (char_length(note) <= 2000)  -- texto livre informado pelo usuario
);
CREATE INDEX checkins_user_time_idx ON checkins(user_id, checked_at DESC);

CREATE TABLE reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('habit','appointment','medication','checkin','other')),
  title TEXT NOT NULL CHECK (char_length(title) <= 200),
  -- Texto neutro mostrado na notificacao (tela bloqueada). Padrao nao revela detalhes.
  notification_text TEXT NOT NULL DEFAULT 'Voce tem um lembrete na AS',
  rrule TEXT,                          -- recorrencia (iCal RRULE), opcional
  next_fire_at TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX reminders_due_idx ON reminders(next_fire_at) WHERE active;

-- Idempotencia: cada disparo (lembrete + instante) so e processado uma vez.
CREATE TABLE reminder_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reminder_id UUID NOT NULL REFERENCES reminders(id) ON DELETE CASCADE,
  fire_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending','sent','failed','user_confirmed','skipped')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (reminder_id, fire_at)
);

-- Eventos de seguranca SEM conteudo da conversa: apenas regra, versao e instante.
CREATE TABLE safety_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  kind TEXT NOT NULL CHECK (kind IN ('emergency_triggered','output_blocked')),
  rule_ids TEXT[] NOT NULL,
  rules_version TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action TEXT NOT NULL,                -- ex.: 'login','logout','data_export','account_delete'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
