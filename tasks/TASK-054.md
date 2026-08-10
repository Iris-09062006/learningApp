# TASK-054 — Repair Lesson Review and Publish Flow

## Status
`VERIFIED`

## Objective
Repair the active-Admin Document-to-Lesson workflow so content created from a
source document reliably reaches the lesson-draft review queue, can be retried
after provider failure, is published through an explicit transaction button,
and becomes reachable from the learner-facing course and lesson routes when the
course publication invariants pass.

## Evidence
- `/moderation` is an AI-exercise queue, while lesson drafts are reviewed inside
  `/admin/content`; the current navigation labels do not communicate that split.
- Existing-course mode creates a new chapter/lesson even though the higher-priority
  TASK-050 packet requires selecting an existing lesson without curriculum writes.
- The browser creates curriculum before generation; a provider failure leaves no
  draft in the queue and exposes no resumable action.
- The publish RPC does not create progress rows for learners already enrolled in
  a course receiving a newly published lesson.
- Existing E2E coverage does not exercise lesson creation, review, publish, or the
  learner-facing destination links.

## Scope
- Rename role navigation destinations so lesson review and exercise moderation
  cannot be confused.
- Restore existing-course mode to select an existing lesson target and skip the
  curriculum creation API.
- Preserve a safe, resumable source/target generation checkpoint in the Admin
  browser session and expose an explicit retry action.
- Replace the ambiguous publish control with a prominent Vietnamese transaction
  button and render learner-facing verification links after successful publish.
- Add a forward-only migration that backfills missing progress for enrolled users
  when a lesson draft is published.
- Add focused component, service, migration, navigation and E2E regression tests.

## Out of Scope
- Deleting historical curriculum/source records.
- Broad course/chapter/lesson CRUD or reordering.
- Merging lesson-draft moderation into the generated-exercise API/schema.
- Applying the migration to a shared database, push, or deployment without a
  separate explicit request.

## Acceptance Criteria
- Admin navigation distinguishes “Duyệt bài tập” from “Tạo & duyệt bài học”.
- New-course mode atomically creates its unpublished course/chapter/lesson target.
- Existing-course mode requires an existing lesson and creates no curriculum rows.
- A generation failure keeps enough non-secret state to retry without uploading
  or creating curriculum again, including after a page refresh in the same tab.
- A generated draft is opened and appears in the lesson review queue.
- An approved draft exposes an explicit `Xuất bản bài học` transaction button.
- Successful publication displays links to the course, roadmap, and lesson only
  when learner-facing visibility is valid.
- Publishing inserts missing `user_progress` rows for existing enrollments without
  overwriting existing progress.
- Focused tests, full `lint`, `typecheck`, `test`, E2E, `build`, and
  `git diff --check` pass; review has no open Critical/High/Medium findings.

## Required Commands
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run test:e2e`
- `npm run build`
- `git diff --check`

## Allowed Files
- `src/components/layout/app-navigation.tsx`
- `src/components/layout/app-navigation.test.tsx`
- `src/features/content-pipeline/components/content-pipeline-admin.tsx`
- `src/features/content-pipeline/components/__tests__/content-pipeline-admin.test.tsx`
- `src/features/content-pipeline/services/content-pipeline-service.ts`
- `src/features/content-pipeline/services/content-pipeline-service.test.ts`
- `src/features/content-pipeline/repositories/publish-progress-migration.test.ts`
- `supabase/migrations/022_backfill_progress_on_lesson_publish.sql`
- `tests/e2e/critical-flows.spec.ts`
- `tests/e2e/support/mock-supabase-server.mjs`
- `tasks/TASK-054.md`
- `reports/TASK-054-implementation.md`
- `reports/TASK-054-test.md`
- `reports/TASK-054-review.md`
- `ACTIVE_TASK.md`
- `project/TASKS.md`
