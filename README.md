# Bual · SPM Bahasa Melayu

React/Vite practice app for SPM speaking, listening, vocabulary and AI tutoring, served by Express with PostgreSQL persistence.

## Student-facing release status

The first audience is students using the app directly, including under-18 students. This is a development preview, not a production release. `STUDENT_DIRECT_MODE` defaults to true and disables Gemini Developer API calls even when a key exists. Keep it enabled for this audience. Set it to false only for eligible adult-only development or teacher use; it is not an age-verification workaround.

Select and validate a provider whose terms permit the actual student audience before enabling live AI. Google's [Gemini Developer API terms](https://ai.google.dev/gemini-api/terms) currently restrict applications directed at or likely to be accessed by under-18s. Non-AI exercises and server scoring remain available. Cloud TTS is a separate optional service and needs its own deployment review.

## Run locally

Requires Node.js 22+.

```powershell
npm ci
Copy-Item .env.example .env
npm run dev
```

Open http://127.0.0.1:3000. Local development uses embedded PostgreSQL (PGlite) under `data/postgres`. Set `DATA_DIR` to isolate test accounts. For eligible adult-only testing, set `STUDENT_DIRECT_MODE=false` and configure `GEMINI_API_KEY` for real assessment; absent providers return an unavailable state.

```powershell
npm run lint
npm run build
npm test
# Local preview only; deployed production requires DATABASE_URL.
$env:ALLOW_LOCAL_DATABASE='true'
npm start
```

Tests expect a current build and use isolated synthetic data. Production startup refuses to run without `DATABASE_URL` unless explicitly overridden for a local preview. Use a private managed PostgreSQL connection with the provider's TLS settings, set `APP_URL` to the public HTTPS origin, and set `HOST=0.0.0.0` if required by the host. Run the first schema initialization with one instance before scaling out. Sessions, rate counters and account writes are shared in PostgreSQL; audio caches and concurrency caps are per process.

## Accounts, payments and providers

Password reset requires `SMTP_URL`, `MAIL_FROM` and `APP_URL`. Reset links expire after 30 minutes, work once and revoke existing sessions. Without SMTP the UI explains that recovery is unavailable. Unverified Google identity login remains disabled.

Stripe checkout requires `STRIPE_SECRET_KEY`, a recurring `STRIPE_PRICE_ID`, and `STRIPE_WEBHOOK_SECRET`. Register `/api/billing/webhook` for `customer.subscription.created`, `.updated`, `.deleted`, `invoice.paid`, and `invoice.payment_failed`. Enable Stripe's customer portal to let subscribers manage cancellation. Checkout prices and identities are server-controlled. Signed webhook events reconcile the current subscription state and grant Plus only until its paid period ends. Refund/dispute policy and operational reconciliation still need to be configured before sales. No real payment or email has been sent during development.

AI usage is counted by feature and by Malaysia calendar day. Basic defaults are 3 speaking assessments and 10 each for tutor chat, AI dictionary lookups, exercise feedback and cloud audio. Plus defaults are ten times those limits. Configure `FREE_<FEATURE>_DAILY_LIMIT`, `PREMIUM_<FEATURE>_DAILY_LIMIT` and `GLOBAL_AI_DAILY_LIMIT` (default 500 across all accounts/features). The previous aggregate `FREE_AI_DAILY_LIMIT`/`PREMIUM_AI_DAILY_LIMIT` settings are no longer used.

Only valid successful provider results consume allowance. Requests reserve capacity before calling the provider; failures release it. One live AI request per account is allowed across features. Identical successful input for the same user/feature/model configuration reuses a persisted result without another charge, even on a later day. Cached results remain accessible when the allowance is exhausted. Reservations expire after two minutes if a process crashes; a fencing token prevents a late response from consuming a replaced reservation. Provider calls are bounded below that lease duration. A provider may still bill a failed call: these limits control application usage, not the provider's monetary billing. Cloud billing alerts are still required.

`GET /api/usage` exposes only the authenticated user's allowance. The page displays remaining speaking/chat uses and refreshes after requests. Local dictionary hits, listening grading and ordinary exercise content do not consume AI allowance. Speaking practice has a two-minute session timer that stops browser recording; server submission length is bounded separately. Persisted AI responses are included in private backups; pending reservations are excluded. Older backups without usage records restore with fresh allowances.

Optional `TTS_PROVIDER=google-cloud` uses the supported Cloud Text-to-Speech API with Application Default Credentials (prefer host workload identity); enable the API and grant the service identity access. `GOOGLE_TTS_VOICE` optionally selects a supported Malay voice. Without it, the client may use device speech; availability and pronunciation depend on the device. The old unofficial Translate audio endpoint has been removed.

## Import and recovery

Legacy JSON is never overwritten. Stop writes while doing operational import/restore and take a private backup first. An explicit import preserves existing profile and score baselines; imported scores are historical, not verified attempt records. Conflicting email identities fail the whole transaction; the same source file is imported only once.

```powershell
npm run db -- import data/users.json
npm run db -- backup C:/private-backups/spm-bm-20260913.json
# Restore into a separately configured EMPTY database; populated databases are refused.
npm run db -- restore C:/private-backups/spm-bm-20260913.json
```

Backup files contain personal data and password hashes: store them privately with encryption/access controls and retention appropriate to your host. Output must be a new filename. Backups include accounts, attempts, reward history and billing state, with a consistency snapshot and checksum; sessions/reset tokens are intentionally excluded. Automated provider backups and a real managed-PostgreSQL restore drill remain deployment responsibilities.

## Design and architecture

- [Editable Figma design](https://www.figma.com/design/hdJrBW6e4FOFM2OMPHRfiu?node-id=2-9): desktop welcome, mobile welcome and speaking practice.
- [Architecture review and deployment limits](ARCHITECTURE.md).
- `server/database.ts`, `accounts.ts`, `attempts.ts`: persistence, identity and server-owned scores.
- `server/recovery.ts`, `billing.ts`, `backups.ts`: commercial operations.
- `server/tts.ts`, `src/services/api.ts`: bounded provider calls and browser transport.

This revision is delivered as source code in the development fork; it has not been deployed to production. Real SMTP, Stripe, AI/audio, managed PostgreSQL, mobile microphone behavior and host-specific load tests require configured services. Review any tracked legacy user JSON for personal data before publishing the repository.

## Shareable preview deployment

The prepared Netlify project is `bual-spm-preview`. The user approved public hosting with account/progress storage. Deployment reached database provisioning, but Netlify returned `database feature not available for this account`. No working public website has been verified yet; selection of an external PostgreSQL database is pending.

`netlify.toml` builds only frontend assets with `npm run build:site`. `/api/*` is handled by the modern Netlify function using the same Express application. Set `DATABASE_URL` as a secret in Netlify's function environment and apply `scripts/deploy-schema.sql` to the selected empty PostgreSQL schema before deploying. Do not put the connection string in source code. The Netlify-specific database SDK has been removed because this account cannot provision it. Keep the local `migrate()` schema and deploy SQL aligned when making future schema changes. Preserve `STUDENT_DIRECT_MODE=true` for this preview, leave payment/SMTP/AI credentials absent, and test with synthetic accounts before inviting students.
