# ACTIVE TASK — TASK-025

**Task ID:** TASK-025
**Title:** Lesson Content API and Viewer
**Module:** Lesson Content / Learning Execution
**Status:** `READY`
**Task Packet:** `tasks/TASK-025.md`

## Required Context

- `docs/requirements.md`
- `docs/features.md` (Module 7: Lesson content — F-LESSON-01, F-LESSON-02)
- `docs/database.md` (§7.4 `chapters`, §7.5 `lessons`, §7.9 `user_progress`)
- `docs/api_contract.md` (§12.1 Get lesson, §12.2 Start lesson)
- `docs/ui.md`
- `tasks/TASK-024.md`
- `reports/TASK-024-review.md`

## Primary Goal

Implement end-to-end lesson content access for enrolled learners, including lesson retrieval, lesson start/progress transition, business-rule enforcement, lesson viewer UI, page integration, and automated tests across repository, service, API, and component layers.

## Scope

- Retrieve published lesson content for an enrolled learner.
- Reject unauthenticated, unenrolled, unpublished, nonexistent, or locked lesson access according to the API contract.
- Transition an accessible lesson from `unlocked` to `in_progress` when the learner starts it.
- Record `started_at` through the existing progress model and preserve completed/in-progress behavior.
- Render lesson title, content, estimated time, and Start/Continue actions.
- Do not expose exercise solutions or server-only data to the client.

## Current Sub-steps

1. [ ] Confirm current database and API contracts before implementation.
2. [ ] Set task status to `IN_PROGRESS` when implementation begins.
3. [ ] Implement lesson types in `src/features/lessons/types/index.ts`.
4. [ ] Implement lesson repository functions.
5. [ ] Implement lesson service business rules.
6. [ ] Create `GET /api/lessons/[lessonId]`.
7. [ ] Create `POST /api/lessons/[lessonId]/start`.
8. [ ] Implement `LessonContentView`.
9. [ ] Build the lesson page at `src/app/(main)/lessons/[lessonId]/page.tsx`.
10. [ ] Add repository, service, API, and UI tests.
11. [ ] Run quality gates: `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build`.
12. [ ] Review the actual diff, produce implementation/review reports, and set status to `VERIFIED` only after all gates pass.

## Dependencies

- `TASK-024` — Visual Learning Roadmap Page (`VERIFIED`)
- Existing course enrollment and `user_progress` infrastructure
- Supabase schema and security policies defined in the repository

## Acceptance Criteria

- `GET /api/lessons/:lessonId` returns `200` with lesson content if the user is enrolled and the lesson is published and accessible.
- Unauthenticated requests receive `401 UNAUTHENTICATED`.
- Unenrolled or locked lesson access receives the appropriate `403` response.
- Nonexistent or unpublished lessons receive `404 NOT_FOUND`.
- `POST /api/lessons/:lessonId/start` transitions an accessible lesson to `in_progress` and records `started_at`.
- Already in-progress or completed lessons behave idempotently and do not regress progress.
- The UI renders lesson content and the correct Start/Continue state.
- No server-only data is exposed to the client.
- `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build` pass without errors or warnings.

## File Scope

- `src/features/lessons/types/index.ts`
- `src/features/lessons/repositories/lesson-repository.ts`
- `src/features/lessons/services/lesson-service.ts`
- `src/app/api/lessons/[lessonId]/route.ts`
- `src/app/api/lessons/[lessonId]/start/route.ts`
- `src/features/lessons/components/lesson-content-view.tsx`
- `src/app/(main)/lessons/[lessonId]/page.tsx`
- `src/features/lessons/repositories/__tests__/lesson-repository.test.ts`
- `src/features/lessons/services/__tests__/lesson-service.test.ts`
- `src/app/api/lessons/[lessonId]/__tests__/route.test.ts`
- `src/app/api/lessons/[lessonId]/start/__tests__/route.test.ts`
- `src/features/lessons/components/__tests__/lesson-content-view.test.tsx`
- `tasks/TASK-025.md`
- `ACTIVE_TASK.md`
- `project/TASKS.md`
- `reports/TASK-025-implementation.md`
- `reports/TASK-025-review.md`
