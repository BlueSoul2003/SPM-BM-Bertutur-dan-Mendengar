CREATE TABLE IF NOT EXISTS schema_versions (version integer PRIMARY KEY);

CREATE TABLE IF NOT EXISTS course_login_codes (
  code_hash text PRIMARY KEY, kind text NOT NULL CHECK(kind IN ('login','setup')),
  challenge text NOT NULL, subject text NOT NULL, email text NOT NULL,
  expires_at timestamptz NOT NULL, session_expires_at timestamptz NOT NULL);
CREATE INDEX IF NOT EXISTS course_codes_expiry ON course_login_codes(expires_at);

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

CREATE TABLE IF NOT EXISTS course_links (
  subject text PRIMARY KEY, user_id text NOT NULL UNIQUE REFERENCES accounts(id),
  linked_at timestamptz NOT NULL DEFAULT now());
INSERT INTO schema_versions(version) VALUES (3) ON CONFLICT DO NOTHING;

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

-- Production runs with search_path=bual. Local PGlite runs use public and its
-- owner role. These new private tables follow the existing backend-only policy.
DO $$
DECLARE t text;
BEGIN
  IF current_schema() = 'bual' AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname='bual_api') THEN
    FOREACH t IN ARRAY ARRAY['course_links','course_login_codes'] LOOP
      EXECUTE format('ALTER TABLE bual.%I ENABLE ROW LEVEL SECURITY',t);
      EXECUTE format('REVOKE ALL ON bual.%I FROM PUBLIC, anon, authenticated',t);
      EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON bual.%I TO bual_api',t);
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='bual' AND tablename=t AND policyname='backend_access') THEN
        EXECUTE format('CREATE POLICY backend_access ON bual.%I FOR ALL TO bual_api USING (true) WITH CHECK (true)',t);
      END IF;
    END LOOP;
  END IF;
END $$;
