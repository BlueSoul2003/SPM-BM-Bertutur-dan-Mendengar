# Architecture review and decision — 2026-09-13

Scope: local implementation based on upstream `551da3803da500db1f827894c416279970946fcf`. No production data migration or deployment was performed.

Keep the React/Vite + Express monolith. A transactional database and clear account/provider boundaries address the observed risks without premature microservices. The frontend uses cream, berry, mint, Nunito and a bear companion with responsive navigation and lazy feature imports.

## Upstream findings and implemented changes

Unauthenticated account reads/writes, destructive reset routes, fast password hashes and unverified Google identities were unsafe for paying users. Accounts now require expiring, revocable sessions; only hashed tokens are stored. Passwords use asynchronous scrypt with valid legacy-login upgrades. Ownership is enforced and unverified Google/passwordless claiming and destructive HTTP resets are disabled. SMTP recovery uses expiring one-use tokens and revokes all sessions after reset.

Synchronous whole-file JSON writes and process-memory sessions have been replaced by PostgreSQL transactions. Development runs the same schema in durable PGlite; production requires `DATABASE_URL`. Account row locks serialize score changes and token rotation. Sessions and rate buckets survive restart and can be shared across replicas. Concurrency caps and the bounded audio cache remain process-local. Initialize the schema with one instance before concurrent startup; schema evolution will need versioned migrations as future changes are introduced.

Client-supplied XP is ignored. Listening is scored against server-owned answers; attempt IDs and content hashes reject conflicting replay. A unique reward key awards each practice topic once per Malaysia calendar day, with a separate once-daily check-in. Speaking requires an actual provider response; unavailable AI no longer fabricates a score. Legacy imports preserve historical score baselines but cannot establish their original validity. Listening material/answers remain bundled for self-study, so this is not a secure examination platform.

Stripe checkout uses a server-configured recurring price and user metadata. Webhooks verify the raw-body signature, deduplicate event IDs transactionally and reread current subscriptions while holding the account lock to avoid stale event ordering. Active matching subscriptions receive an expiring entitlement. Daily AI/audio request quotas use shared atomic counters. Portal access is authenticated. Refunds/disputes, notification monitoring and periodic provider reconciliation still need an operational policy before charging; no live gateway test is claimed.

The unofficial Google Translate TTS URL is replaced with the supported Cloud Text-to-Speech API and Google Application Default Credentials. Speech calls have a 20-second deadline, bounded chunk parallelism, pending-request deduplication and a 16 MiB cache. Client transport has cancellation/timeouts; AI calls have bounded upstream waits. Missing providers give an unavailable state or device-voice fallback.

## Data operations and rollout limits

An explicit transactional legacy import never edits source JSON and records a source checksum. Backups use a repeatable-read snapshot and an integrity checksum; restoration requires an empty database and excludes credentials that grant an active session. Backups contain personal data and must use private encrypted storage. Original tracked JSON remains untouched pending review of its data-retention/publication requirements.

Before deployment: supply host and private provider configuration, verify managed PostgreSQL connectivity/TLS and restoration, test Stripe test-mode checkout/renewal/cancellation and SMTP delivery, configure refund/dispute handling and monitoring, and exercise actual AI/audio and microphone access on target phones. Establish a traffic target and measure latency on that host. Current tests do not establish production latency or email/payment delivery guarantees.

## Validation

TypeScript checks, production build and integration tests cover account ownership, persistent sessions across database reopen, concurrent duplicate awards, input replay conflicts, daily quota/check-in limits, webhook forgery/deduplication/stale delivery, reset-token reuse/session revocation, and backup/import rollback/restoration using isolated synthetic data. Browser checks cover responsive navigation. External provider behavior is mocked in automated tests.

References: [Stripe webhooks](https://docs.stripe.com/webhooks), [PostgreSQL transactions in node-postgres](https://node-postgres.com/features/transactions), [PGlite API](https://pglite.dev/docs/api), [SMTP transport](https://nodemailer.com/smtp), [Cloud TTS synthesis](https://docs.cloud.google.com/text-to-speech/docs/reference/rest/v1/text/synthesize).

## Student-direct release decision — 2026-09-16

The user confirmed that the first release serves students directly. Default-disable Gemini Developer API through `STUDENT_DIRECT_MODE` (only the explicit value false enables eligible adult-only use). Provider eligibility for under-18 users, student data handling and actual Malay assessment quality must be established before live AI is enabled for this release. This changes the previous assumption that adding a Gemini key is sufficient for launch. GitHub publication is source-code delivery, not production deployment.

## Usage accounting revision — 2026-09-16

Replace request-count middleware with transactional reservations at actual provider calls. The `ai_usage` table stores a hashed request identity, feature/day, pending lease, fencing owner and successful result. A shared short row lock serializes capacity reservations across instances; network calls run outside transactions. Successful results are cached per account and reused on retries. Failed provider/parse/validation calls release reservations; pending work expires after crashes. Basic quotas separate speaking (3/day), chat (10/day) and dictionary/feedback/audio (10/day each), with a global default of 500 successful or live reserved calls/day. These counts are not a dollar spending cap, and failed upstream requests can still incur provider charges. Persisted AI results contain student content and follow the database's private backup/access policy. Student-direct Gemini restrictions remain unchanged.

## Shareable website preparation — 2026-09-16

Separate application creation (`server/app.ts`) from the local server entry point. Netlify's modern Request/Response function wraps the same Express routes, preserving raw webhook bodies and using the platform-supplied client IP. The function reads a private `DATABASE_URL` configuration. The static site uses a dedicated Vite-only build so backend bundles and source maps are not published as public assets. The preview labels AI as unavailable and is marked noindex.

The user explicitly approved public hosting with account/progress storage. Netlify project `bual-spm-preview` uses external PostgreSQL because Netlify Database is unavailable for this account (HTTP 403). `scripts/deploy-schema.sql` holds the initial schema; the free Supabase deployment is described below. Local deployment-adapter tests exercise registration, authorization, check-in persistence and logout against the deploy SQL schema.

## Free database deployment — 2026-09-16

The user selected the Gregory Hong organization and authorized a free independent database and public collection of account/progress data. Supabase quoted US$0/month and created Bual SPM (`acogfmsaoyuulbbjlgfd`) in Singapore. The initial schema is installed in private schema `bual`; public schema access is not used. A dedicated non-superuser login `bual_api` has table CRUD and schema usage privileges, no schema creation or role/database administration. All 11 Bual tables enable RLS with a backend-only policy. Supabase security advisors returned no findings. The pg pool is capped at two connections per instance and API errors log sanitized codes only.

Netlify deployment `6aaa34d54e595516519e2ad6` successfully published the frontend and function. Public frontend checks passed at 390px and 1440px; the live API test stopped at `/api/health` returning 503. The connector's claimed secret-variable save did not persist, and official SDK writes using function scope returned 403. A default-scope non-sensitive `APP_URL` was saved, but broadening the database credential's scope was rejected by automatic safety review and was not executed. `DATABASE_URL` remains absent from Netlify, so no successful managed-database connection or public account flow is claimed. On 2026-09-16 the user explicitly paused deployment and asked to preserve the work. No Vercel project was created or transferred. Resume only after the user requests it, resolve the hosting configuration, then run the complete live account/progress verification.

## Vercel deployment preparation — 2026-09-17

The user resumed work and selected the existing Vercel account. Preserve React/Vite and Express; add a Node request adapter at `api/index.ts`, reuse the database connection pool across requests, and retry initialization after failure. Vercel overwrites the forwarded client-IP header, so the adapter trusts one platform proxy for shared rate limiting. Route `/api/*` to the backend and keep the remaining frontend on the static CDN; set the function region to Singapore near the database. Exclude local data and environment files from uploads. The owner completed two-factor verification and CLI authentication succeeded. The official team API confirms an active Hobby plan for `team_zQbeEZ0V1NUWIiLmggcjMzeg`; CLI lists the unrelated `mandarin-care-group-mcg` project, which is untouched. The connector's empty project listing was incomplete. TypeScript and deployment integration checks pass, including real HTTP login, retained scores, logout and rejected revoked sessions through the Vercel adapter. No deployment or plan upgrade has been performed. The user must choose an eligible hosting plan because Hobby is non-commercial only and this project has a commercial purpose. Live API tests and managed PostgreSQL connectivity remain required before student access.
