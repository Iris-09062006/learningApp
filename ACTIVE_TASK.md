# Active Task Information

## Task Identification
- **Task ID:** TASK-023
- **Title:** Course Enrollment Feature & API Integration
- **Phase:** Phase 3 — Authentication & Learning Core
- **Status:** READY

## Context & Objectives
- **Scope:**
  - Triển khai API Route `POST /api/courses/[id]/enroll` để đăng ký khóa học cho người dùng.
  - Sử dụng RPC `enroll_course(p_user_id, p_course_id)` nguyên tử đã được xác minh trong Supabase database.
  - Tự động tạo bản ghi `course_enrollments` và khởi tạo tiến độ học tập `user_progress` cho lesson đầu tiên.
  - Xây dựng UI button & state xử lý Enroll trên trang chi tiết khóa học `/courses/[id]`.
- **Primary Objective:** Hoàn thiện luồng đăng ký học (Enrollment) kết nối Frontend với Backend Supabase RPC.

## Allowed Files
- `src/app/api/courses/[id]/enroll/route.ts`
- `src/features/courses/services/enrollment-service.ts`
- `src/features/courses/components/enroll-button.tsx`
- `src/app/courses/[id]/page.tsx`
- `tests/` (Unit / Integration / E2E tests liên quan)

## Quality Gates Requirements
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`