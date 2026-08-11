# TASK-061 Implementation Report

## Outcome

Implemented Option A locally. `POST /api/lessons/:lessonId/start` no longer attempts a direct
`user_progress` upsert; it calls a new hardened `start_lesson` database RPC.

## Changes

- Added forward-only migration `028_create_start_lesson_rpc.sql`.
- The RPC requires an authenticated active learner, a published Lesson/Course, a non-cancelled
  enrollment, and an existing non-locked progress row.
- Enrollment and progress rows are locked before mutation.
- `unlocked` transitions to `in_progress`; repeat calls preserve `in_progress` or `completed` and
  preserve the original `started_at` while refreshing `last_accessed_at` and `updated_at`.
- Direct client INSERT/UPDATE permissions on `user_progress` remain closed.
- Repository and generated Supabase types now use `start_lesson`; authoritative RPC rejections map
  to the existing API error contract.
- Added migration, repository, and service regression coverage.

## Files Changed

- `supabase/migrations/028_create_start_lesson_rpc.sql`
- `src/generated/database.types.ts`
- `src/features/lessons/repositories/lesson-repository.ts`
- `src/features/lessons/repositories/__tests__/lesson-repository.test.ts`
- `src/features/lessons/repositories/start-lesson-migration.test.ts`
- `src/features/lessons/services/lesson-service.ts`
- `src/features/lessons/services/__tests__/lesson-service.test.ts`
- Task state and TASK-061 reports.

## Hosted Supabase

Migration `20260811133320_create_start_lesson_rpc` was applied through Supabase MCP. The application
was not pushed or deployed.
