# Active Task Information

## Task Identification
- **Task ID:** TASK-023
- **Title:** Course Enrollment Feature & API Integration
- **Phase:** Phase 3 — Authentication & Learning Core
- **Status:** VERIFIED

## Context & Objectives
- **VERIFIED:**
  - Cập nhật types, repository, service, API route `POST /api/courses/:courseId/enroll` gọi Supabase RPC `enroll_course` với server client session-bound.
  - Cập nhật `CourseDetailView` fetch API và render UI state (isEnrolled, errors).
  - Test suite (Route, Service, Repository, Component) pass 98/98.
- **Sau audit TASK-000 (cleanup):**
  - TASK-022 (Course Catalog/Details) đã commit xong.
  - Cảnh báo cấu hình ESLint lỗi thời trong `next build` (`useEslintrc`, `extensions`) còn tồn tại — chưa xử lý ở scope này.

## Quality Gates (trạng thái repo hiện tại trước TASK-023)
- `npm run lint` (PASSED - không warning)
- `npm run typecheck` (PASSED)
- `npm run test` (PASSED)
- `npm run build` (PASSED; có cảnh báo ESLint)

## Next Queued Task
- **Task ID:** TASK-024
- **Title:** User Roadmap & Progress Initialization
- **Status:** DRAFT (Cần plan sau)
