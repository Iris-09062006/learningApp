# TASK-058 Test Report

## Required gates

- `npm run lint` — PASS
- `npm run typecheck` — PASS
- `npm run test` — PASS
- `npm run test:e2e` — PASS, 10 tests
- `npm run build` — PASS
- `git diff --check` — PASS (line-ending warnings only)

## Focused evidence

- Lesson/provider/service/moderation/migration suite — PASS, 55 tests before final additions.
- Timeout, Lesson-fixed generation UI and idempotent publish regressions — PASS, 23 tests.
- Migration static tests verify empty search paths, locked transactional transitions, revoked
  direct writes, real option-ID mapping, idempotency and no Course-import mutation.

## Remote Supabase verification

- Migration history includes `024`, `025`, and `026` in order.
- All five Lesson-to-Exercise functions exist with empty `search_path`; the four public RPCs are
  `SECURITY DEFINER` and execute is limited to `authenticated`, not `anon`.
- `anon` and `authenticated` have no direct INSERT/UPDATE/DELETE privilege on
  `generated_exercises` or `exercise_reviews`; only Moderator/Admin SELECT policies remain.
- Course-import tables and `courses.archived_at` exist remotely with RLS enabled.
- Security advisors report no ERROR. The four new WARN entries are intentional because these
  role-checking RPCs must be callable by `authenticated` before enforcing active Moderator/Admin.
