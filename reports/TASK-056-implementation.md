# TASK-056 Implementation Report

## Outcome

Active Admins now have explicit, confirmed controls to “Đuổi học viên” and “Xóa khóa học”.
Learner removal deactivates the account through the existing audited RPC. Course deletion
uses a new atomic archive RPC that unpublishes the entire curriculum and hides the Course
without deleting enrollments, progress, submissions, drafts, sources, or audit history.

## Implementation

- Added `/admin/courses`, Admin-only navigation, course list API, and DELETE API.
- Added `courses.archived_at`, the `courses_archived_not_published` invariant, active-course
  index, and `admin_archive_course` with active-Admin authorization and audit logging.
- Removed archived courses from Admin course lists, content target choices, and pending
  Course draft batches.
- Renamed Learner deactivation to “Đuổi học viên” and added confirmation/success feedback.
- Added route, service, repository, migration, and component regression tests.
- Updated generated database types and product/security/API/database/UI contracts.

## Deployment

Migration `024` was not applied to a shared or production Supabase project. No push or
deployment was performed. Pre-existing changes in `AGENTS.md`, `docs/decisions.md`, and
untracked probe files were preserved outside this task.
