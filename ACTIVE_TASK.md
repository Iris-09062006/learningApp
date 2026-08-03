# Active Task Information

## Task Identification
- **Task ID:** TASK-022
- **Title:** Course Catalog and Course Detail
- **Phase:** Phase 3 — Authentication & Learning Core
- **Status:** IN_PROGRESS

## Context & Objectives
- **In progress:**
  - Repository layer (`types/index.ts`, `repositories/course-repository.ts`) đã có.
  - Chưa có: `course.service`/`course-service.ts`, API routes `GET /api/courses`, `GET /api/courses/:courseId`, UI components (`course-card`, `course-list`, `course-detail-view`), pages `/courses` và `/courses/[courseId]`, cùng unit tests.
- **Sau audit TASK-000 (cleanup):**
  - Đã gỡ bỏ các task/report không chính xác (TASK-101–105, TASK-011–014, report TASK-022 giả).
  - `project/ROADMAP.md`, `project/TASKS.md` đã được viết lại theo trạng thái thực tế.
  - Cảnh báo cấu hình ESLint lỗi thời trong `next build` (`useEslintrc`, `extensions`) còn tồn tại — cần xử lý ở task cấu hình tách biệt.

## Quality Gates (trạng thái repo hiện tại, không phải mới từ task này)
- `npm run lint` (PASSED - không warning)
- `npm run typecheck` (PASSED)
- `npm run test` (PASSED - 61/61)
- `npm run build` (PASSED; có cảnh báo ESLint option lỗi thời từ Next.js nội bộ)

## Next Queued Task
- **Task ID:** TASK-023
- **Title:** Course Enrollment Feature & API Integration
- **Status:** READY (bắt đầu sau khi TASK-022 hoàn thành)