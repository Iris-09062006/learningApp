# TASK-061 — Start Lesson Through a Security-Definer RPC

## Status
`VERIFIED`

## Owner / Reviewer
Codex / Codex

## Objective
Fix `POST /api/lessons/:lessonId/start` failing with PostgreSQL `42501` by moving the
`user_progress` write behind an authenticated, security-definer `start_lesson` RPC.

## Required Context
- `docs/architecture.md` (§4.5 and progress write boundary)
- `docs/api_contract.md` (§12.2 Start lesson)
- `docs/database.md` (§7.9 `user_progress`)
- `docs/features.md` (F-LESSON-02)
- `docs/security.md` (§6.4 and progress tampering threat)
- `supabase/migrations/008_create_rls_policies.sql`
- `supabase/migrations/009_create_rpc_functions.sql`
- `supabase/migrations/016_harden_cloud_permissions_and_indexes.sql`

## Scope
- Add a forward-only migration defining and granting `public.start_lesson(bigint)`.
- Authenticate and authorize an active learner with a non-cancelled enrollment.
- Lock and update the learner's existing progress row atomically.
- Transition only `unlocked` to `in_progress`; preserve `in_progress` and `completed`.
- Preserve the first `started_at` and refresh `last_accessed_at`/`updated_at` on valid access.
- Replace the repository's direct `user_progress` upsert with the RPC.
- Update generated database types and add migration/repository regression tests.
- Preserve unrelated working-tree changes; do not apply the migration or deploy without explicit authorization.

## Acceptance Criteria
- [x] `authenticated` still has no direct INSERT/UPDATE grant on `user_progress`.
- [x] `start_lesson` is `security definer`, has an empty `search_path`, and is executable only by `authenticated`.
- [x] Unauthenticated, inactive/non-learner, unenrolled, missing-progress, and locked access is rejected.
- [x] `unlocked` becomes `in_progress` and records timestamps atomically.
- [x] Repeated starts are idempotent for status and `started_at`, including completed lessons.
- [x] Repository calls `rpc("start_lesson", { p_lesson_id })` and maps the response contract.
- [x] Focused tests and all required quality gates pass; review has no open findings.

## Required Commands
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- `git diff --check`
