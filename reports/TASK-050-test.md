# TASK-050 Test Report

## Local quality gates

- Focused route/service/component/migration/title tests — PASS, 19 tests.
- `npm run lint` — PASS, zero warnings.
- `npm run typecheck` — PASS.
- `npm run test` — PASS, 79 files and 438 tests.
- `npm run build` — PASS, Next.js 15.5.22 production build.
- `npm run test:e2e` — PASS, 9 Playwright tests.
- `git diff --check` — PASS; only line-ending notices were printed.

## Database verification

- Migration history contains `20260810053252 / 020_separate_content_target_flows`.
- Both destination RPCs are `SECURITY DEFINER` with empty `search_path`.
- `anon` execute privilege is false; `authenticated` execute privilege is true.
- Both functions perform an active-Admin check before mutation.
- The existing `phương pháp tính / Nội suy lagrange` rows and their no-lesson state
  remained unchanged after migration.

## Preview smoke

- Deployment status: `READY`.
- `GET /api/system/health` — 200 JSON; database `connected`.
- `GET /api/admin/content-targets` without a session — 401 JSON.
- `HEAD /admin/content` without a session — 307 to login.
- Deployment-scoped warning/error/fatal log scan — no logs found.
