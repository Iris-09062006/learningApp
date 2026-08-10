# TASK-053 - Allow Active Admins to Read Draft Curriculum Targets

## Status
`VERIFIED`

## Objective
Fix Document-to-Lesson generation after curriculum creation by allowing an active
Admin session to read unpublished courses, chapters, and lessons required by the
generation context query.

## Evidence
- Source document `id=5` is `extracted` with 1,510 characters.
- Target lesson `id=1` exists and is unpublished.
- The same lesson query under the active Admin's `authenticated` RLS context returns
  zero rows.
- Current curriculum RLS only exposes fully published rows.

## Scope
- Add SELECT-only RLS policies for active Admins on `courses`, `chapters`, and
  `lessons`.
- Read the generation context through the existing server-only Admin client after
  the service has authorized the active Admin, so local generation works before
  the remote migration can be applied.
- Preserve public published-content policies and all write boundaries.
- Add migration regression coverage.
- Run local quality gates and review.
- Prepare the matching RLS migration for a separately authorized database release.

## Out of Scope
- Browser-side or unauthorized service-role access, curriculum write grants, role
  changes, provider changes, or deletion of failed source records.
- Vercel deployment.

## Acceptance Criteria
- Active Admin can select the unpublished course/chapter/lesson target.
- Learner, inactive Admin, and anonymous visibility are not broadened.
- Existing published-content policies remain intact.
- `lint`, `typecheck`, `test`, `build`, migration tests, and review pass.
- A read-only live-data probe proves the server-side generation context can resolve
  the extracted source and unpublished target locally.

## Allowed Files
- `supabase/migrations/021_allow_active_admins_read_curriculum.sql`
- `src/features/content-pipeline/repositories/admin-curriculum-rls-migration.test.ts`
- `src/features/content-pipeline/repositories/content-pipeline-repository.ts`
- `src/features/content-pipeline/repositories/content-pipeline-repository.test.ts`
- `tasks/TASK-053.md`
- `reports/TASK-053-implementation.md`
- `reports/TASK-053-test.md`
- `reports/TASK-053-review.md`
- `ACTIVE_TASK.md`
- `project/TASKS.md`
