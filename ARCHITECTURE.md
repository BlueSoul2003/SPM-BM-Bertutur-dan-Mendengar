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
