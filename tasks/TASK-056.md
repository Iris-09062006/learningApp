# TASK-056 — Admin Learner Removal and Safe Course Deletion

## Status
`VERIFIED`

## Owner / Reviewer
Codex / Codex

## Objective
Give active administrators clear, server-authorized controls to remove a learner's
access and to remove a course from the product without destroying learning history.

## Dependencies
- `TASK-033` — User Administration (`VERIFIED`)
- `TASK-055` — Course Generation and Review (`VERIFIED`)

## Required Context
- `AGENTS.md`
- `CODEX.md`
- `docs/requirements.md`
- `docs/database.md`
- `docs/api_contract.md`
- `docs/security.md`
- `docs/ui.md`

## In Scope
- Present the existing audited account deactivation as an explicit “Đuổi học viên” action.
- Require confirmation and preserve last-active-admin protection.
- Add an Admin course-management page and API.
- Implement course deletion as an atomic soft delete/archive that unpublishes the
  course curriculum while preserving enrollments, progress, submissions, drafts,
  and audit history.
- Enforce active-Admin authorization in the database RPC and server layers.
- Add regression tests and update contracts/documentation.

## Out of Scope
- Hard-deleting Auth users, submissions, progress, source documents, or curriculum.
- Restoring archived courses, bulk deletion, migration deployment, push, or deploy.

## Files Allowed to Change
- `src/app/(main)/admin/**`
- `src/app/api/admin/**`
- `src/components/layout/app-navigation.tsx`
- `src/features/admin/**`
- `src/features/content-pipeline/repositories/content-pipeline-repository.ts`
- `src/features/content-pipeline/repositories/content-pipeline-repository.test.ts`
- `src/generated/database.types.ts`
- `supabase/migrations/024_admin_course_archival.sql`
- `docs/requirements.md`
- `docs/database.md`
- `docs/api_contract.md`
- `docs/security.md`
- `docs/ui.md`
- `docs/features.md`
- `tasks/TASK-056.md`
- `reports/TASK-056-*.md`
- `ACTIVE_TASK.md`
- `project/TASKS.md`

## Acceptance Criteria
- [x] Active Admin can explicitly deactivate/kick an active learner after confirmation.
- [x] Learner, Moderator, inactive Admin, and unauthenticated callers cannot mutate users or courses.
- [x] Active Admin can list non-archived courses and delete/archive one after confirmation.
- [x] Deleted course and its curriculum are unpublished and hidden from Admin management/catalog.
- [x] Learning history and related records are preserved.
- [x] Both mutations create audit evidence and return stable API envelopes.
- [x] Last-active-admin protection remains intact.
- [x] Lint, typecheck, tests, build, diff review, and secret review pass.

## Required Commands
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- `git diff --check`
