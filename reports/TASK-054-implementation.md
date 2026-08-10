# TASK-054 Implementation Report

## Outcome

The Admin Document-to-Lesson flow now distinguishes lesson review from exercise
moderation, targets existing lessons without creating curriculum, resumes failed
AI generation, publishes through an explicit transaction button, and exposes
learner verification links only when the course is public.

## Implementation

- Renamed navigation entries to `Duyệt bài tập` and `Tạo & duyệt bài học`.
- Existing-content mode now selects a `ContentTarget` lesson and skips
  `/api/admin/content-curriculum` entirely.
- Added a non-secret per-tab generation checkpoint with retry UI. The server now
  accepts retry only for a prior `GENERATION_FAILED` source, not extraction errors.
- Reconciles a stale checkpoint when the matching draft already exists, covering a
  lost client response after successful persistence.
- Added the explicit `Xuất bản bài học (transaction)` button and post-publication
  course, roadmap, and lesson links when `coursePublished` is true.
- Added migration `022` to insert missing progress for non-cancelled existing
  enrollments, preserve existing progress, and reactivate completed enrollments
  receiving a new unfinished lesson.
- The idempotent publish response now includes the current `coursePublished` value.
- Added component, service, navigation, migration, and critical-flow E2E coverage.

## Scope and deployment

No historical data was deleted. Migration `022` was not applied to the shared
Supabase project, and no push or deployment was performed.

Existing user changes in `AGENTS.md`, `docs/decisions.md`, and untracked probe files
were preserved and excluded from the task commit.
