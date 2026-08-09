# TASK-038 — Security and RLS Regression Hardening — Test Report

## Test Scope

- Auth/session regression tests for inactive-account rejection.
- Route-level tests for login/register/AI/moderation rate limiting and 429 responses.
- Local Postgres integration assertions for cross-user isolation, `exercise_solutions`, RPC privileges, and atomic counters.
- Full regression suite and production build verification.

## Commands and Results

| Command | Result |
|---|---|
| `npm run lint` | PASS |
| `npm run typecheck` | PASS |
| Combined TASK-037/038 targeted regression command | PASS — 58/58 tests |
| `npm run test` | PASS — 408/408 tests across 174 suites |
| `npm run build` | PASS — production build completed successfully |
| `npx supabase db reset --local --no-seed` | PASS — clean database applied migrations `001–017` |
| `docker exec supabase_db_learningapp psql -v ON_ERROR_STOP=1 -U postgres -d postgres -f /tmp/task_038_rls.sql` | PASS — all SQL assertions and rollback completed |
| `npx supabase db lint --local --schema public,private --level warning --fail-on warning` | PASS — no schema errors |
| `npx supabase db advisors --local --type all --level warn --fail-on error` | PASS — no issues |

The first full-suite run failed only because the new migration used the timestamp name emitted by Supabase CLI while this repository enforces sequential names. It was renamed to `017_add_distributed_rate_limits.sql`; the clean DB reset and full suite then passed.
