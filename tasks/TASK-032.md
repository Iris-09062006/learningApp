# TASK-032 — Learner Dashboard and Profile Management

## Status
`READY`

## Required Context
- `docs/requirements.md`
- `docs/features.md` (Module 15: Profile Module — F-PROFILE-01, F-PROFILE-02)
- `docs/database.md` (§7.1 `profiles`, §7.5 `course_enrollments`, §7.9 `user_progress`)
- `docs/api_contract.md`
- `docs/security.md`

## Objectives
1. Implement Learner Profile API (`GET /api/profile`, `PATCH /api/profile`) for fetching and updating user details (username).
2. Create Learner Dashboard view (`/dashboard`) showcasing enrolled courses, current progress, next recommendations, and quick resume links.
3. Enforce strictly that regular users can only read and edit their own profile and learning stats.
4. Prevent unauthorized updates to restricted fields like `role`, `id`, or `active_status`.
5. Cover API handlers, profile updates, and responsive component UI with comprehensive tests.

## File Scope
- `src/features/profile/types/index.ts`
- `src/features/profile/repositories/profile-repository.ts`
- `src/features/profile/services/profile-service.ts`
- `src/features/profile/components/`
- `src/app/api/profile/`
- `src/app/(main)/dashboard/`
- `src/app/(main)/profile/`
- `src/features/profile/**/__tests__/`
- `src/app/api/profile/**/__tests__/`
- `tasks/TASK-032.md`
- `ACTIVE_TASK.md`
- `project/TASKS.md`
- `project/ROADMAP.md`
- `reports/TASK-032-implementation.md`
- `reports/TASK-032-review.md`

## Acceptance Criteria
- `/api/profile` returns the authenticated learner's details and summarized learning metrics.
- Username updates via `PATCH /api/profile` are validated and saved without allowing modifications to roles or statuses.
- Learner dashboard UI accurately displays active course progress and provides direct access to continue learning.
- Tests verify owner authorization isolation, invalid input rejections, and correct rendering.
- `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build` pass without errors or warnings.

## Non-Goals
- Avatar image uploads.
- Password change via direct app DB write (handled via Supabase Auth flow).