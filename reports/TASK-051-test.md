# TASK-051 Test Report

## GitHub Actions failure reproduced

- Run `31361233448`, job `93370375837` — FAIL at `npm ci` because the lockfile was
  missing `@emnapi/core@1.11.3` and `@emnapi/runtime@1.11.3`.
- Downstream lint, typecheck, test, build, and E2E were skipped in that run.

## Local verification after fix

- `npm ci` — PASS; 550 packages installed, 0 vulnerabilities reported.
- `npm run lint` — PASS, zero warnings.
- `npm run typecheck` — PASS.
- `npm run test` — PASS.
- `npm run build` — PASS, Next.js 15.5.22 production build.
- `npm run test:e2e` — PASS, 9 Chromium tests.
- `git diff --check` — PASS with existing line-ending notices only.

## Remote verification

- GitHub Actions run `31362387357` — PASS.
- `Lint, typecheck, test, and build` job `93373682987` — PASS.
- `Deterministic Chromium E2E` job `93373993806` — PASS.
- Vercel deployment `dpl_EWaxn3whDXbWXKeLhz9bzz2kChnw` — `READY`, Production.
- `GET /` and `GET /courses` through the production deployment — PASS.
- `GET /api/system/health` — PASS; `status: ok`, `database: connected`.
- Unauthenticated content-target and lesson-draft APIs — PASS; returned structured
  `UNAUTHENTICATED` errors.
- Invalid login probe using an `.invalid` email — PASS; returned
  `401 UNAUTHENTICATED` with no `Retry-After`, not `429 RATE_LIMITED`.
- Supabase API log after the login probe — PASS; `consume_rate_limit` returned 200.
