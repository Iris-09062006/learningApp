# Task Packet: TASK-022 — Course Catalog & Course Detail Feature

## Status
`IN_PROGRESS`

## Owner
Codex

## Reviewer
Codex

## Feature ID
F-COURSE-01 (Course Catalog), F-COURSE-03 (Course Detail)

## Objective
Xây dựng tính năng Danh sách khóa học (`Course Catalog`) và Chi tiết khóa học (`Course Detail`) bao gồm:
- Feature Service & Repository truy vấn thông tin khóa học từ Database (Supabase PostgreSQL / mock client fallback).
- API Route Handlers: `GET /api/courses` và `GET /api/courses/:courseId`.
- UI Components: `CourseCard`, `CourseList`, `CourseDetailView`.
- Pages: `/courses` (Danh sách khóa học) và `/courses/[courseId]` (Chi tiết khóa học).
- Đầy đủ Unit Tests cho Service, API handlers và UI Components.

## Dependencies
- `TASK-003` (Primitive UI Components Foundation)
- `TASK-010` / `TASK-012` (Database Schema & Supabase Types)
- `TASK-020` / `TASK-021` (Auth Services & Session Handling)

## Required Context
- `AGENTS.md`
- `CODEX.md`
- `docs/features.md` (F-COURSE-01, F-COURSE-03)
- `docs/api_contract.md` (Section 10.1, 10.2)
- `docs/architecture.md`
- `docs/coding_standards.md`
- `docs/ui.md`

## In Scope
- Service & Repository layer tại `src/features/courses/`:
  - `src/features/courses/types/index.ts`: TypeScript interfaces cho `CourseSummary`, `CourseDetail` theo API contract.
  - `src/features/courses/services/course-service.ts`: Logic lấy danh sách khóa học (hỗ trợ phân trang, ghép thông tin `isEnrolled` và `completionPercentage` nếu user đã đăng nhập) và lấy chi tiết khóa học.
- API Route Handlers tại `src/app/api/courses/`:
  - `src/app/api/courses/route.ts`: Handler cho `GET /api/courses?page=1&pageSize=20`.
  - `src/app/api/courses/[courseId]/route.ts`: Handler cho `GET /api/courses/:courseId`.
- Feature UI Components tại `src/features/courses/components/`:
  - `course-card.tsx`: Card hiển thị thông tin tóm tắt khóa học, badge độ khó, ngôn ngữ, trạng thái đăng ký/tiến độ.
  - `course-list.tsx`: Lưới hiển thị danh sách khóa học responsive kèm phân trang hoặc trống.
  - `course-detail-view.tsx`: Giao diện chi tiết khóa học hiển thị tiêu đề, mô tả, badge, số lượng bài học/chương, nút hành động ("Bắt đầu học" / "Tiếp tục học").
- Next.js Pages:
  - `src/app/(main)/courses/page.tsx`: Trang Danh sách khóa học.
  - `src/app/(main)/courses/[courseId]/page.tsx`: Trang Chi tiết khóa học.
- Unit Tests:
  - `src/features/courses/services/course-service.test.ts`
  - `src/app/api/courses/route.test.ts`
  - `src/app/api/courses/[courseId]/route.test.ts`
  - `src/features/courses/components/course-card.test.tsx`
  - `src/features/courses/components/course-detail-view.test.tsx`

## Out of Scope
- Search khóa học `?search=...` (F-COURSE-02 - P1 extension).
- Enrollment action `POST /api/courses/:courseId/enroll` (TASK-023).
- Roadmap page `/courses/:courseId/roadmap` (TASK-024).

## Files Allowed to Change
- `src/features/courses/*`
- `src/app/api/courses/*`
- `src/app/(main)/courses/*`
- `tasks/TASK-022.md`
- `project/TASKS.md`
- `ACTIVE_TASK.md`
- `reports/TASK-022-implementation.md`
- `reports/TASK-022-test.md`
- `reports/TASK-022-review.md`

## Quality Gates
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`

## Acceptance Criteria
- [ ] `GET /api/courses` trả về danh sách khóa học published theo đúng format `CourseSummary[]`, hỗ trợ pagination.
- [ ] `GET /api/courses/:courseId` trả về thông tin chi tiết khóa học `CourseDetail` (bao gồm chapterCount, lessonCount, isEnrolled).
- [ ] Trang `/courses` hiển thị giao diện responsive với danh sách khóa học, badge, tiến độ.
- [ ] Trang `/courses/[courseId]` hiển thị chi tiết khóa học và nút hành động thích hợp ("Bắt đầu học" cho Guest/Chưa đăng ký, "Tiếp tục học" nếu đã đăng ký).
- [ ] Unit tests pass 100%.
- [ ] Quality gates (`lint`, `typecheck`, `test`, `build`) pass 100%.