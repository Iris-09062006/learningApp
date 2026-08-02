# Task Packet: TASK-014 — Supabase SSR Clients & Database Types Integration

## Status
`DONE`

## Owner
Codex

## Reviewer
Gemini / Antigravity

## Feature ID
Database & API Foundation / Supabase Clients

## Objective
Tái lập trình các Supabase SSR Clients chuẩn hóa (`client.ts`, `server.ts`, `admin.ts`) trong `src/lib/supabase/` và tạo khai báo TypeScript Database Types chuẩn (`src/generated/database.types.ts`) phủ đầy đủ 11 bảng Core MVP, 7 enums thực tế từ migration `001_create_enums.sql` và RPC functions theo `docs/architecture.md`, `docs/database.md` và `docs/security.md`.

## Dependencies
- `TASK-010` (Database Migrations: Core Tables)
- `TASK-011` (Database Migrations: Core RLS Policies)
- `TASK-012` (Core Database RPC Functions)

## Required Context
- [AGENTS.md](file:///c:/Users/iris/project/AGENTS.md)
- [CODEX.md](file:///c:/Users/iris/project/CODEX.md)
- [docs/architecture.md](file:///c:/Users/iris/docs/architecture.md)
- [docs/database.md](file:///c:/Users/iris/docs/database.md)
- [docs/security.md](file:///c:/Users/iris/docs/security.md)

## Current State
- Dự án đã hoàn tất các SQL Migrations 001–009 cho Database Core Tables, Seed, RLS Policies và RPC Functions (`enroll_course`, `submit_exercise`).
- `package.json` đã có sẵn các thư viện `@supabase/ssr` và `@supabase/supabase-js`.
- File `src/generated/database.types.ts` chưa tồn tại và các client trong `src/lib/supabase/` đã bị dọn dẹp ở TASK-010A để khôi phục baseline typecheck sạch.

## In Scope
- Tạo file `src/generated/database.types.ts`:
  - Định nghĩa giao diện TypeScript `Database` cho toàn bộ schema Core MVP.
  - Phủ 11 bảng public (`profiles`, `courses`, `chapters`, `lessons`, `exercises`, `exercise_options`, `exercise_solutions`, `course_enrollments`, `user_progress`, `submissions`, `ai_explanations`).
  - Phủ đúng 7 Core Enums được tạo bởi `001_create_enums.sql`:
    1. `user_role` ('learner', 'moderator', 'admin')
    2. `enrollment_status` ('active', 'completed', 'cancelled')
    3. `exercise_type` ('fix_the_bug', 'predict_output')
    4. `difficulty_level` ('easy', 'medium', 'hard')
    5. `exercise_source` ('manual', 'ai_generated')
    6. `progress_status` ('locked', 'unlocked', 'in_progress', 'completed')
    7. `ai_response_status` ('success', 'failed')
  - Định nghĩa `courses.level` là `string` / `varchar(50)` theo migration `003_create_curriculum_tables.sql`.
  - Phủ các RPC Functions (`enroll_course`, `submit_exercise`, `has_role`).
- Tạo `src/lib/supabase/client.ts`:
  - Xuất hàm `createBrowserSupabaseClient()` sử dụng `createBrowserClient<Database>` từ `@supabase/ssr`.
  - Đọc `NEXT_PUBLIC_SUPABASE_URL` và `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Tạo `src/lib/supabase/server.ts`:
  - Xuất hàm async `createServerSupabaseClient()` sử dụng `createServerClient<Database>` từ `@supabase/ssr`.
  - Quản lý cookie store Next.js App Router bằng `cookies()` từ `next/headers`.
- Tạo `src/lib/supabase/admin.ts`:
  - Xuất hàm `createAdminSupabaseClient()` sử dụng `createClient<Database>` từ `@supabase/supabase-js`.
  - Đọc `NEXT_PUBLIC_SUPABASE_URL` và `SUPABASE_SERVICE_ROLE_KEY`.
  - Thêm `import "server-only";` ở đầu file và tắt `persistSession: false` / `autoRefreshToken: false`.
- Viết Unit Test tại `src/lib/supabase/supabase.test.ts` kiểm thử việc tạo các client function.
- Chạy và kiểm tra 100% Quality Gates.

## Out of Scope
- Không tạo các enum không có trong migration `001` (như `course_level` hay `exercise_review_status`).
- Không chỉnh sửa hay thêm bất kỳ file SQL migration nào trong `supabase/migrations/`.
- Không tạo UI pages hay Auth services của Phase 3.
- Tuyệt đối không import `admin.ts` vào bất kỳ Client Component hay shared code nào chạy phía trình duyệt.

## Files Allowed to Change
- `src/generated/database.types.ts`
- `src/lib/supabase/client.ts`
- `src/lib/supabase/server.ts`
- `src/lib/supabase/admin.ts`
- `src/lib/supabase/supabase.test.ts`
- `tasks/TASK-014.md`
- `project/TASKS.md`
- `ACTIVE_TASK.md`
- `reports/TASK-014-implementation.md`

## Files Not Allowed to Change
- `supabase/migrations/*`
- `src/app/*`
- `src/components/*`
- `docs/*`
- `project/AGENTS.md`
- `project/CODEX.md`
- `project/GEMINI.md`

## Implementation Requirements
- `admin.ts` bắt buộc phải chứa `import "server-only";` ở dòng đầu tiên.
- Tất cả các Supabase client factory functions phải được gán generic type `<Database>` từ `@/generated/database.types`.
- Xử lý ném Exception rõ ràng khi thiếu biến môi trường cấu hình Supabase URL hoặc Keys.

## API Requirements
- Not applicable.

## Database Requirements
- Tuân thủ chính xác định dạng cột, khóa chính, khóa ngoại, nullable, enum và kiểu dữ liệu trong `supabase/migrations/001_create_enums.sql` đến `009_create_rpc_functions.sql`.

## Security Requirements
- Khóa `SUPABASE_SERVICE_ROLE_KEY` chỉ được đọc trong `admin.ts` phía server-side, không bao giờ lộ ra client bundle.

## UI Requirements
- Not applicable.

## Tests Required
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`

## Acceptance Criteria
- [x] File `src/generated/database.types.ts` được tạo đầy đủ type definitions cho 11 bảng public, 7 core enums thực tế và 3 RPC functions.
- [x] `courses.level` được gán kiểu string (không dùng enum giả).
- [x] Hàm `createBrowserSupabaseClient` hoạt động chuẩn với generic `<Database>`.
- [x] Hàm `createServerSupabaseClient` tương thích với Next.js App Router `cookies()`.
- [x] Hàm `createAdminSupabaseClient` sử dụng `SUPABASE_SERVICE_ROLE_KEY` và chứa `server-only` guard.
- [x] Unit tests cho Supabase clients pass 100%.
- [x] Quality gates (`npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`) pass 100%.

## Required Commands
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`

## Expected Handoff
- Task packet tại `tasks/TASK-014.md`.
- Implementation report tại `reports/TASK-014-implementation.md`.
- `project/TASKS.md` và `ACTIVE_TASK.md` được cập nhật tương ứng.
