# Task Packet: TASK-012 — Core Database RPC Functions & Supabase Types

## Status
`DONE`

## Owner
Codex

## Reviewer
Gemini / Antigravity

## Objective
Tạo SQL Migration cho các RPC Functions nguyên tử (`enroll_course`, `submit_exercise`), khởi tạo Supabase SSR Clients (`src/lib/supabase/client.ts`, `server.ts`, `admin.ts`) và định nghĩa TypeScript database types tại `src/generated/database.types.ts` theo `docs/database.md` & `docs/api_contract.md`.

## Dependencies
- `TASK-011` (DONE — Database Migrations & RLS Policies)

## Required Context
- [AGENTS.md](file:///c:/Users/iris/project/AGENTS.md)
- [CODEX.md](file:///c:/Users/iris/project/CODEX.md)
- [database.md](file:///c:/Users/iris/docs/database.md)
- [api_contract.md](file:///c:/Users/iris/docs/api_contract.md)
- [security.md](file:///c:/Users/iris/docs/security.md)
- [architecture.md](file:///c:/Users/iris/docs/architecture.md)

## Current State
- Database migrations cho 11 bảng public Core MVP và RLS Policies đã hoàn thành (`TASK-011`).
- Chưa có SQL RPC functions xử lý enrollment & submission nguyên tử.
- Chưa có Supabase SSR Browser, Server & Service Role Admin clients trong `src/lib/supabase/` và chưa có TypeScript DB types trong `src/generated/database.types.ts`.

## In Scope
- Tạo SQL Migration `supabase/migrations/009_create_rpc_functions.sql`:
  - `public.enroll_course(p_course_id bigint)`:
    - Kiểm tra user authenticated (`auth.uid()`).
    - Kiểm tra `course` tồn tại và `is_published = true`.
    - Thêm record vào `course_enrollments` (`status = 'active'`).
    - Khởi tạo `user_progress` cho tất cả các bài học thuộc khóa học (bài học đầu tiên của chapter đầu tiên `status = 'unlocked'`, tất cả bài học khác `status = 'locked'`).
    - Đảm bảo tính nguyên tử (atomic transaction).
  - `public.submit_exercise(p_exercise_id bigint, p_answer jsonb)`:
    - Kiểm tra user authenticated (`auth.uid()`).
    - Truy vấn đáp án từ `exercise_solutions` (server-side evaluation).
    - So sánh `p_answer` với `solution` -> xác định `is_correct` (boolean) và `score` (100.00 hoặc 0.00).
    - Tính `attempt_number` tự tăng cho `user_id` + `exercise_id`.
    - Ghi record vào `submissions`.
    - Nếu `is_correct = true`:
      - Cập nhật `user_progress` của bài học hiện tại thành `completed`.
      - Mở khóa bài học tiếp theo (`status = 'unlocked'`) trong cùng chapter hoặc chapter kế tiếp nếu có.
    - Trả về JSON result: `{ "submission_id": bigint, "is_correct": boolean, "score": numeric, "lesson_completed": boolean, "next_lesson_unlocked_id": bigint }`.
- Tạo Supabase Browser Client `src/lib/supabase/client.ts` (`createBrowserClient`).
- Tạo Supabase Server Client `src/lib/supabase/server.ts` (`createServerClient` xử lý cookie).
- Tạo Supabase Admin Client `src/lib/supabase/admin.ts` (`createClient` dùng `SUPABASE_SERVICE_ROLE_KEY` chỉ cho Server-side).
- Tạo TypeScript Type Definitions `src/generated/database.types.ts` khớp với 11 bảng DB và các RPC functions.

## Out of Scope
- Viết API Route Handlers hoặc Server Actions (thuộc Phase 3).
- Viết UI components (Catalog, Lesson, Mentor UI).
- Khởi tạo real AI explanation service.

## Files Allowed to Change
- `package.json`
- `package-lock.json`
- `supabase/migrations/009_create_rpc_functions.sql`
- `src/lib/supabase/client.ts`
- `src/lib/supabase/server.ts`
- `src/lib/supabase/admin.ts`
- `src/generated/database.types.ts`
- `tasks/TASK-012.md`
- `ACTIVE_TASK.md`

## Files Not Allowed to Change
- `docs/*`
- `project/*`

## Implementation Requirements
- Mọi SQL RPC function phải có `SECURITY DEFINER` và `set search_path = public`.
- Cấu hình `@supabase/ssr` và `@supabase/supabase-js`.
- File `src/lib/supabase/admin.ts` **tuyệt đối không được xuất hiện trong Client Component (`"use client"`) bundle**.

## API Requirements
- RPC Response format khớp với `docs/api_contract.md`.

## Database Requirements
- Transactions trong RPC function xử lý nguyên tử.

## Security Requirements
- Đáp án bài tập `exercise_solutions` chỉ được truy vấn an toàn bên trong RPC `submit_exercise` hoặc bởi Service Role client.
- Chặn mọi thao tác cập nhật điểm số hay tiến độ từ phía client.

## UI Requirements
- Not applicable.

## Tests Required
- Kiểm tra cú pháp SQL RPC migrations.
- Chạy các lệnh Quality Gates bắt buộc (`npm run lint`, `npm run typecheck`, `npm run build`).

## Acceptance Criteria
- [ ] Migration `009_create_rpc_functions.sql` tạo thành công `enroll_course` và `submit_exercise`.
- [ ] `enroll_course` khởi tạo enrollment và user_progress nguyên tử (mở khóa duy nhất bài học đầu tiên).
- [ ] `submit_exercise` chấm bài server-side, lưu submission, complete bài học và unlock bài học tiếp theo nguyên tử.
- [ ] Supabase clients (`client.ts`, `server.ts`, `admin.ts`) được khởi tạo chuẩn hóa.
- [ ] `src/generated/database.types.ts` định nghĩa đầy đủ TypeScript types.
- [ ] Các lệnh Quality Gates (`npm run lint`, `npm run typecheck`, `npm run build`) pass 100%.

## Required Commands
- `npm run lint`
- `npm run typecheck`
- `npm run build`

## Expected Handoff
- Task packet tại `tasks/TASK-012.md`.
- File migration SQL tại `supabase/migrations/009_create_rpc_functions.sql`.
- Supabase clients & types trong `src/lib/supabase/` và `src/generated/`.
- Implementation Report tại `reports/TASK-012-implementation.md`.
