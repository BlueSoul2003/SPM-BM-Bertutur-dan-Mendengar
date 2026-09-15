CREATE TABLE IF NOT EXISTS schema_versions (version integer PRIMARY KEY);

CREATE TABLE IF NOT EXISTS accounts (
      id text PRIMARY KEY, email text NOT NULL UNIQUE, username text NOT NULL UNIQUE,
      password_hash text, salt text, profile jsonb NOT NULL DEFAULT '{}',
      points integer NOT NULL DEFAULT 0 CHECK(points >= 0), streak integer NOT NULL DEFAULT 0,
      last_checkin text NOT NULL DEFAULT '', last_grade jsonb,
      speaking_done integer NOT NULL DEFAULT 0, listening_done integer NOT NULL DEFAULT 0,
      created_at timestamptz NOT NULL DEFAULT now());

CREATE TABLE IF NOT EXISTS sessions (
      token_hash text PRIMARY KEY, user_id text NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      expires_at timestamptz NOT NULL);

CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS attempts (
      id text NOT NULL, user_id text NOT NULL REFERENCES accounts(id), kind text NOT NULL,
      topic text NOT NULL, input_hash text NOT NULL, result jsonb NOT NULL,
      awarded integer NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(user_id,id));

CREATE TABLE IF NOT EXISTS rewards (
      user_id text NOT NULL REFERENCES accounts(id), reward_key text NOT NULL,
      points integer NOT NULL CHECK(points >= 0), created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(user_id,reward_key));

CREATE TABLE IF NOT EXISTS rate_buckets (
      bucket text PRIMARY KEY, hits integer NOT NULL, expires_at timestamptz NOT NULL);

CREATE INDEX IF NOT EXISTS rate_expiry ON rate_buckets(expires_at);

CREATE TABLE IF NOT EXISTS entitlements (
      user_id text PRIMARY KEY REFERENCES accounts(id), provider text NOT NULL,
      subscription_id text UNIQUE, valid_until timestamptz NOT NULL, updated_at timestamptz NOT NULL DEFAULT now());

CREATE TABLE IF NOT EXISTS payment_events (
      id text PRIMARY KEY, processed_at timestamptz NOT NULL DEFAULT now());

CREATE TABLE IF NOT EXISTS reset_tokens (
      token_hash text PRIMARY KEY, user_id text NOT NULL REFERENCES accounts(id), expires_at timestamptz NOT NULL);

CREATE TABLE IF NOT EXISTS imports (source_hash text PRIMARY KEY, imported_at timestamptz NOT NULL DEFAULT now(), count integer NOT NULL);

CREATE TABLE IF NOT EXISTS ai_usage (
      user_id text NOT NULL REFERENCES accounts(id), feature text NOT NULL, input_hash text NOT NULL,
      day text NOT NULL, status text NOT NULL CHECK(status IN ('pending','done')), owner text NOT NULL,
      lease_until timestamptz NOT NULL, result jsonb, PRIMARY KEY(user_id,feature,input_hash));

CREATE INDEX IF NOT EXISTS ai_usage_day ON ai_usage(day,user_id,feature);

INSERT INTO schema_versions(version) VALUES (1),(2) ON CONFLICT DO NOTHING;
