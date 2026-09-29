# Bual · SPM Bahasa Melayu

React/Vite practice app for SPM speaking, listening, vocabulary and AI tutoring, served by Express with PostgreSQL persistence.

## Student-facing release status

The first audience is students using the app directly, including under-18 students. A public educational pilot is live at [bual-spm.vercel.app](https://bual-spm.vercel.app). Account creation, listening scoring and progress storage have passed live checks; AI assessment is not enabled. `STUDENT_DIRECT_MODE` defaults to true and disables Gemini Developer API calls even when a key exists. Keep it enabled for this audience. Set it to false only for eligible adult-only development or teacher use; it is not an age-verification workaround.

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

This revision is delivered in the [development fork](https://github.com/BlueSoul2003/SPM-BM-Bertutur-dan-Mendengar). The public pilot is available for small-scale student testing. Real SMTP, payments, AI/cloud audio, target-phone microphone behavior, database restore drills and host-specific load tests remain unverified.

## Public educational pilot — 2026-09-17

**Website: https://bual-spm.vercel.app**

The user authorized deployment and explicitly approved saving the dedicated Supabase `bual_api` connection in Vercel project `bual-spm` as a Production-only sensitive `DATABASE_URL`. The current release is non-commercial educational use on the existing Hobby account, with the independent Supabase Free project Bual SPM in Singapore. No paid services or payment features were enabled. Reassess hosting eligibility before charging.

Vite publishes only frontend assets. `api/index.ts` serves the existing Express API in Singapore. The root-only `/data/` upload exclusion preserves bundled learning material in `src/data/`; shared curriculum re-exports use Node-compatible `.js` extensions. Supabase shared-pooler connections use `verify-full` and the public CA downloaded from the [official dashboard certificate link](https://supabase-downloads.s3-ap-southeast-1.amazonaws.com/prod/ssl/prod-ca-2021.crt), included under `server/certs/`. This is a public certificate, not a private key. Credentials are never shipped to the browser or repository.

Live synthetic-account checks passed: registration, login, once-daily check-in, listening scoring (3 correct answers / 45 XP), replay without duplicate XP, retained 65 XP after logging in again, and rejection of revoked sessions. Disabled AI returns unavailable without consuming allowance. Requests in one sequential smoke test took about 50–600 ms; this is not a load or availability guarantee. TypeScript, frontend build and deployment-adapter integration tests also passed.

The database uses private schema `bual`, 11 RLS-enabled tables and a restricted CRUD-only backend role. TLS connectivity and schema access are verified. Keep `STUDENT_DIRECT_MODE=true` (the default); AI, SMTP and payment credentials are absent. Device speech is the available audio fallback and depends on the device. Automated backups/restore drills and phone audio testing remain before broader rollout.

Deployments currently use the authenticated Vercel CLI; automatic GitHub deployment is not connected. The unrelated `mandarin-care-group-mcg` project is untouched. The earlier [Netlify frontend preview](https://bual-spm-preview.netlify.app) has no database connection and is superseded by the Vercel URL above.

## Student workflow completion — 2026-09-23

### Interactive-course integration — 2026-09-29 (live)

The integration uses the existing interactive-course account for every student, retains the full Bual interface, and adds a return-to-course link. Old Bual accounts can be explicitly linked after proving their password; their IDs, records and XP remain intact. Matching email addresses never auto-link. A new student deliberately chooses a fresh 0-XP record. Once chosen, automatic reassignment/merging is not supported. Students who cannot prove their old password should contact the operator rather than start replacement records.

Implementation: `server/course-auth.ts`, `src/components/CourseEntry.tsx`, `src/services/courseAuth.ts`; decisions and rollback details are in `ARCHITECTURE.md`. [Bual PR #1](https://github.com/BlueSoul2003/SPM-BM-Bertutur-dan-Mendengar/pull/1) and [portal PR #26](https://github.com/BlueSoul2003/interactive-course/pull/26) are merged. The portal release was prepared in `G:/GregOS/.codex-tmp/bual-integration-20260929` from published main; the canonical portal checkout's unrelated edits are retained.

Verified: TypeScript and production build pass; all 10 automated tests pass, with targeted retests after final backend/schema changes and successful GitHub CI. Tests cover issuer validation, anonymous/forged identity rejection, wrong proof/password, replay/expiry, competing links, old XP preservation and session revocation. The portal navigation/access tests pass. A local browser fixture using isolated data completed both old-account linking (65 XP retained) and new-account creation (0 XP), same-tab redirects and return navigation; the 390px layout has no horizontal overflow. Live browser verification then reused the existing portal session, passed real Supabase verification, and returned to Bual onboarding without another platform password. No old/new account choice was made on behalf of the real student; actual account selection and a complete live practice remain the user's manual check.

The two additive production `bual` tables were created with RLS and backend-only grants; anon/authenticated cannot read them and the Supabase security advisor returned no findings. Existing accounts and attempts were not moved or deleted. The owner explicitly approved the production switch after the initial automatic approval rejection. Vercel device login recovered through the in-app browser's manual-code flow. Production `COURSE_AUTH_PUBLIC_KEY` contains only the portal's public/anon key and `COURSE_SSO_ENABLED=true`. Deployment `dpl_Gzr4FEAmCr4Qb7jQYUoiRQ11rTvt` was built with `--skip-domain`, checked via authenticated CLI, and promoted after portal Pages run `36540086504` succeeded (portal application merge `e87d51c`, Bual application merge `bd9c337`). The public URL is still https://bual-spm.vercel.app. Live health/config respond correctly, legacy login/registration return 410, anonymous account/history reads return 401, and a forged portal token is rejected.

Next action / manual check: open [SPM → Bahasa Melayu](https://bluesoul2003.github.io/interactive-course/#/secondary/spm/spm-bm), choose Bual, and on first entry choose the old-account link if you have existing progress. Enter the old Bual password only there and confirm the retained history/XP; new students choose a fresh record. Complete one practice and return to the course list. If onboarding expires, restart login; no old records are lost. AI and Bual recovery email remain disabled. On shared devices, sign out in both applications: portal logout does not immediately revoke an already issued Bual session, which expires within the original token lifetime (maximum one hour). Future Bual releases use the existing Vercel CLI project; portal main commits automatically publish Pages.

The free student release now offers a complete speaking self-review path: draft answers remain in the same browser tab for that account, students compare a bundled model answer, use a checklist and download their practice. Self-review is explicitly ungraded and awards no XP. Assessed listening attempts remain in PostgreSQL and the most recent 20 are available through an authenticated history view. No schema migration is needed.

`/api/capabilities` returns only public availability flags. Disabled AI has no misleading daily allowance or dead-end chat form. Device speech runs directly when cloud speech is absent; browser voice availability varies. Cancellation releases audio resources, recognition stops on unmount/errors/backgrounding, and practice timers use elapsed time. Browser speech recognition may use the browser provider; the UI explains the typing alternative.

Vocabulary is now isolated by account in local browser storage. The former shared word-bank key is retained but is not silently assigned to any account. Vocabulary is not synced across devices. Session validation shows a loading state, stale session responses cannot reinstate a signed-out account, revoked sessions return to login, and a failed page load offers recovery. XP ranking is correctly labeled cumulative, not a weekly reset; the unavailable global-reset control and unsupported grade/statistical claims have been removed.

The owner confirmed there is no sender mailbox/domain yet and explicitly deferred recovery email. The form explains its unavailable state. Live AI, cloud audio, payment services and automatic deployment are not enabled by this update. Automated tests exercise history ownership, capability flags, native audio cancellation, backup restoration and existing API boundaries; actual microphone accuracy on iOS/Android and an operational managed-database backup/restore drill still require validation before a wider release.

Delivery status: published successfully on 2026-09-23 to https://bual-spm.vercel.app (deployment dpl_8a7DD6ebX1E7sh2FuteHt1JTQFA7, application commit 9c1bcf5). Vercel authorization recovered and the remote frontend/function build passed. Local type checks and all 8 automated tests pass; local browser checks cover speaking self-review, retained drafts and the 390px layout. Live checks pass for registration/login, listening scoring, saved attempt history, duplicate-XP prevention, revoked sessions and disabled-provider flags. The public homepage and deferred recovery-email message were verified in the browser. A bounded live 20-request concurrent authenticated read check succeeded 20/20 (median 1582 ms, p95 1646 ms, maximum 1649 ms); this is not a production capacity guarantee. Next: open the public site on an actual iOS/Android phone, sign in, complete one speaking self-review and one listening practice, then confirm microphone/audio behavior and saved listening history before inviting a wider group.
