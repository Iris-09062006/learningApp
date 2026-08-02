# Task Packet: TASK-013 — Database Migrations: RLS Policies & Security

## Status
`READY`

## Owner
Codex

## Reviewer
Gemini / Antigravity

## Feature ID
Security Foundation

## Objective
Khởi tạo và áp dụng Row Level Security (RLS) policies đầy đủ cho 100% các bảng public trong database theo quy định tại `docs/security.md` và `docs/database.md`.

## Dependencies
- `TASK-010` (Core Database Tables)
- `TASK-012` (Core Database RPC Functions & Supabase Types)

## Required Context
- [AGENTS.md](file:///c:/Users/iris/project/AGENTS.md)
- [CODEX.md](file:///c:/Users/iris/project/CODEX.md)
- [database.md](file:///c:/Users/iris/docs/database.md)
- [security.md](file:///c:/Users/iris/docs/security.md)
- [architecture.md](file:///c:/Users/iris/docs/architecture.md)

## Current State
- Bảng database Core MVP (`001`-`007`) và RPC Functions (`009`) đã được khởi tạo.
- Cần đảm bảo file migration RLS Policies `supabase/migrations/008_create_rls_policies.sql` được cấu hình đầy đủ RLS Policies, kiểm tra phân quyền chặt chẽ cho 100% các bảng Core MVP.

## In Scope
- Tạo helper function `public.has_role(required_role public.user_role)` với `SECURITY DEFINER` và `set search_path = public`.
- Bật RLS (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`) cho 100% các bảng public: `profiles`, `courses`, `chapters`, `lessons`, `exercises`, `exercise_options`, `exercise_solutions`, `course_enrollments`, `user_progress`, `submissions`, `ai_explanations`.
- Phân quyền SELECT, UPDATE cho `profiles` (User chính chủ `auth.uid() = id`).
- Phân quyền SELECT cho nội dung khóa học (`courses`, `chapters`, `lessons`, `exercises`, `exercise_options`) khi `is_published = true`.
- Khóa 100% quyền SELECT trực tiếp từ client đối với bảng `exercise_solutions` (Server-only).
- Cấu hình RLS Policy cho `course_enrollments`, `user_progress`, `submissions`, `ai_explanations` (Chỉ user chính chủ đọc được).
- Chặn client thao tác INSERT/UPDATE/DELETE trực tiếp lên progress, submissions, enrollments.

## Out of Scope
- Viết API Route Handlers hay Server Actions (thuộc Phase 3).
- Viết UI Components.
- Tạo các bảng P1 Operations Extension (`generated_exercises`, `exercise_reviews`, `admin_logs`).

## Files Allowed to Change
- `supabase/migrations/008_create_rls_policies.sql` (hoặc file migration SQL tương ứng trong `supabase/migrations/`)
- `tasks/TASK-013.md`
- `project/TASKS.md`
- `ACTIVE_TASK.md`

## Files Not Allowed to Change
- `docs/*`
- `src/*`

## Implementation Requirements
- Cú pháp SQL tiêu chuẩn PostgreSQL / Supabase CLI.
- Mọi helper function `SECURITY DEFINER` phải cài đặt `set search_path = public`.
- Đảm bảo tính idempotent bằng cách dùng `DROP POLICY IF EXISTS` trước khi `CREATE POLICY`.

## API Requirements
- Not applicable.

## Database Requirements
- 100% các bảng public phải bật RLS.
- Bảng `exercise_solutions` tuyệt đối không cấp SELECT policy cho `anon` hoặc `authenticated`.

## Security Requirements
- Tuân thủ 100% các quy định bảo mật tại `docs/security.md`.
- Ngăn chặn client tự thay đổi role, is_active, điểm số hoặc tiến độ.

## UI Requirements
- Not applicable.

## Tests Required
- Kiểm tra cú pháp SQL migration.
- Chạy các lệnh Quality Gates bắt buộc (`npm run lint`, `npm run typecheck`, `npm run build`).

## Acceptance Criteria
- [ ] 100% các bảng public (`profiles`, `courses`, `chapters`, `lessons`, `exercises`, `exercise_options`, `exercise_solutions`, `course_enrollments`, `user_progress`, `submissions`, `ai_explanations`) được bật RLS.
- [ ] Bảng `exercise_solutions` không có SELECT policy cho role `anon` hoặc `authenticated`.
- [ ] Helper function `has_role` khởi tạo với `SECURITY DEFINER` và `set search_path = public`.
- [ ] User chỉ truy vấn/cập nhật được dữ liệu thuộc về chính mình (`user_id = auth.uid()`).
- [ ] Các lệnh Quality Gates (`npm run lint`, `npm run typecheck`, `npm run build`) pass 100%.

## Required Commands
- `npm run lint`
- `npm run typecheck`
- `npm run build`

## Expected Handoff
- Task packet ghi vào `tasks/TASK-013.md`.
- Master task summary & detailed packets trong `project/TASKS.md` cập nhật `TASK-013` thành `READY`.
- `ACTIVE_TASK.md` được cập nhật thông tin `TASK-013` ở trạng thái `READY`.
- Implementation Report tại `reports/TASK-013-implementation.md`.
