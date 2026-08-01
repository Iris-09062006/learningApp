# Task Packet: TASK-011 — Database Migrations: RLS Policies & Security

## Status
`VERIFIED`

## Owner
Codex

## Reviewer
Gemini / Antigravity

## Objective
Viết SQL Migration khởi tạo và cấu hình Row Level Security (RLS) policies cho 100% các bảng public trong Supabase PostgreSQL theo đúng quy định tại `docs/security.md` và `docs/database.md`.

## Dependencies
- `TASK-010` (Bootstrap)

## Required Context
- [AGENTS.md](file:///c:/Users/iris/project/AGENTS.md)
- [CODEX.md](file:///c:/Users/iris/project/CODEX.md)
- [database.md](file:///c:/Users/iris/docs/database.md)
- [security.md](file:///c:/Users/iris/docs/security.md)
- [architecture.md](file:///c:/Users/iris/docs/architecture.md)

## Current State
- Nền tảng dự án Next.js đã được bootstrap (`TASK-010`).
- Tài liệu quy định database schema, phân quyền RLS và security rules đã được thống nhất tại `docs/database.md` và `docs/security.md`.
- Cần tạo file SQL Migration cho RLS Policies trong `supabase/migrations/`.

## In Scope
- Tạo helper function `public.has_role(required_role public.user_role)` với `SECURITY DEFINER` và `set search_path = public`.
- Enable RLS (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`) cho 100% các bảng public: `profiles`, `courses`, `chapters`, `lessons`, `exercises`, `exercise_options`, `exercise_solutions`, `course_enrollments`, `user_progress`, `submissions`, `ai_explanations`.
- Tạo RLS Policy cho `profiles`:
  - SELECT cho chính chủ (`auth.uid() = id`).
  - UPDATE username cho chính chủ (`auth.uid() = id`) kèm kiểm tra không cho sửa `role` hoặc `is_active`.
- Tạo RLS Policy cho nội dung khóa học (`courses`, `chapters`, `lessons`, `exercises`, `exercise_options`):
  - SELECT công khai cho `anon` và `authenticated` khi `is_published = true`.
- **Bảo mật tuyệt đối `exercise_solutions`**:
  - KHÔNG cấp bất kỳ SELECT policy nào cho role `anon` hoặc `authenticated` (Server-only).
- Tạo RLS Policy cho `course_enrollments`, `user_progress`, `submissions`:
  - SELECT cho chính chủ (`user_id = auth.uid()`).
  - Chặn client INSERT/UPDATE/DELETE trực tiếp.
- Tạo RLS Policy cho `ai_explanations`:
  - SELECT cho chính chủ nếu submission liên quan thuộc về `auth.uid()`.

## Out of Scope
- Tạo RPC functions nguyên tử phức tạp như `submit_exercise` hoặc `enroll_course` (thuộc `TASK-012` / `TASK-014`).
- Viết API Route Handlers hay Server Actions (thuộc Phase 3).
- Tạo các bảng P1 Operations Extension (`generated_exercises`, `exercise_reviews`, `admin_logs`).

## Files Allowed to Change
- `supabase/migrations/*_create_rls_policies.sql` (hoặc file migration SQL tương ứng trong `supabase/migrations/`)
- `tasks/TASK-011.md`
- `ACTIVE_TASK.md`

## Files Not Allowed to Change
- `docs/*`
- `src/*`
- `project/*`

## Implementation Requirements
- Sử dụng cú pháp SQL tiêu chuẩn của PostgreSQL / Supabase CLI.
- Mọi helper function `SECURITY DEFINER` bắt buộc phải có `set search_path = public`.
- Đảm bảo tính idempotent (dùng `DROP POLICY IF EXISTS` trước khi `CREATE POLICY`).

## API Requirements
- Not applicable.

## Database Requirements
- 100% các bảng public bắt buộc được bật RLS.
- Bảng `exercise_solutions` hoàn toàn không có policy SELECT cho client.

## Security Requirements
- Tuân thủ 100% các chính sách bảo mật RLS trong `docs/security.md`.
- Chặn client tự cập nhật `role`, `is_active`, `is_correct`, `score`, hoặc progress status.

## UI Requirements
- Not applicable.

## Tests Required
- Kiểm tra cú pháp SQL migration.
- Chạy các lệnh Quality Gates bắt buộc (`npm run lint`, `npm run typecheck`, `npm run build`).

## Acceptance Criteria
- [ ] 100% các bảng public (`profiles`, `courses`, `chapters`, `lessons`, `exercises`, `exercise_options`, `exercise_solutions`, `course_enrollments`, `user_progress`, `submissions`, `ai_explanations`) được bật RLS.
- [ ] Bảng `exercise_solutions` không có SELECT policy cho `anon` hoặc `authenticated`.
- [ ] Helper function `has_role` được khởi tạo với `SECURITY DEFINER` và `set search_path = public`.
- [ ] User chỉ đọc/sửa được dữ liệu riêng của chính mình trên các bảng `profiles`, `user_progress`, `submissions`, `course_enrollments`, `ai_explanations`.
- [ ] Các lệnh Quality Gates (`npm run lint`, `npm run typecheck`, `npm run build`) pass 100%.

## Required Commands
- `npm run lint`
- `npm run typecheck`
- `npm run build`

## Expected Handoff
- Task packet được ghi vào `tasks/TASK-011.md`.
- File migration SQL được tạo trong `supabase/migrations/`.
- Implementation Report được Codex ghi vào `reports/TASK-011-implementation.md`.
