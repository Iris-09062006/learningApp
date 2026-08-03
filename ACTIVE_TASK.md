# ACTIVE TASK — TASK-024

**Task ID:** TASK-024
**Title:** Visual Learning Roadmap Page
**Module:** Roadmap / Course
**Status:** `VERIFIED`
**Task Packet:** `tasks/TASK-024.md`

## Primary Goal
Build end-to-end support for viewing a course roadmap for enrolled learners, including progress calculation, API endpoint `GET /api/courses/:courseId/roadmap`, repository/service layer methods, visual Roadmap UI, page integration, and automated unit tests across all added layers.

## Current Sub-steps
1. [x] Create task packet `tasks/TASK-024.md` and set active task to IN_PROGRESS.
2. [x] Extend types in `src/features/courses/types/index.ts`.
3. [x] Implement repository function `fetchCourseRoadmap` in `src/features/courses/repositories/course-repository.ts`.
4. [x] Implement service method `getCourseRoadmap` in `src/features/courses/services/course-service.ts`.
5. [x] Create API Route Handler `src/app/api/courses/[courseId]/roadmap/route.ts`.
6. [x] Implement Client Component `src/features/courses/components/course-roadmap-view.tsx`.
7. [x] Build Next.js Page `src/app/(main)/courses/[courseId]/roadmap/page.tsx`.
8. [x] Write unit tests for repo, service, API route handler, and UI component.
9. [x] Execute quality gates (`npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`).
10. [x] Produce implementation and review reports, set status to `VERIFIED`, and commit.
