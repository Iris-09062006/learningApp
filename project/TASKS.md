# TASKS — Task Board & Master Task List

## 1. Master Task Summary

| Task ID | Title | Status | Owner | Reviewer | Phase |
|---|---|---|---|---|---|
| `TASK-000` | Setup Documentation & Agent Workflow | `DONE` | Antigravity | User | Phase 0 |
| `TASK-001` | Bootstrap Next.js & Project Config | `READY` | Codex | Gemini | Phase 1 |
| `TASK-002` | Configure Testing Setup (Vitest & Playwright) | `READY` | Codex | Gemini | Phase 1 |
| `TASK-003` | Primitive UI Components Foundation | `READY` | Codex | Gemini | Phase 1 |
| `TASK-010` | Database Migrations: Core Tables | `READY` | Codex | Gemini | Phase 2 |
| `TASK-011` | Database Migrations: RLS Policies & Security | `READY` | Codex | Gemini | Phase 2 |
| `TASK-012` | Core Database RPC Functions & Supabase Types | `READY` | Codex | Gemini | Phase 2 |
| `TASK-020` | Authentication Service & API Handlers | `READY` | Codex | Gemini | Phase 3 |
| `TASK-021` | Auth Pages UI (Login & Register) | `READY` | Codex | Gemini | Phase 3 |
| `TASK-022` | Course Catalog & Course Detail Feature | `READY` | Codex | Gemini | Phase 3 |
| `TASK-023` | Course Enrollment Feature | `READY` | Codex | Gemini | Phase 3 |
| `TASK-024` | Visual Learning Roadmap Page | `READY` | Codex | Gemini | Phase 3 |
| `TASK-030` | Lesson Content Viewer Feature | `READY` | Codex | Gemini | Phase 4 |
| `TASK-031` | Exercise Shell & Evaluators | `READY` | Codex | Gemini | Phase 4 |
| `TASK-032` | Submission Service & Grading Engine | `READY` | Codex | Gemini | Phase 4 |
| `TASK-033` | Progress Engine & Unlock Next Lesson Logic | `READY` | Codex | Gemini | Phase 4 |
| `TASK-040` | AI Integration Infrastructure Layer | `READY` | Codex | Gemini | Phase 5 |
| `TASK-041` | AI Explanation Feature & Mentor UI | `READY` | Codex | Gemini | Phase 5 |

---

# 2. Detailed Task Packets

---

## TASK-000 — Setup Documentation & Agent Workflow

### Status
DONE

### Objective
Hoàn thiện toàn bộ hệ thống tài liệu chuẩn trong `docs/` và `project/` để làm nền tảng cho AI Agent thực thi dự án.

---

## TASK-001 — Bootstrap Next.js & Project Config

### Status
READY

### Owner
Codex

### Reviewer
Gemini / Antigravity

### Feature ID
System Foundation

### Objective
Khởi tạo ứng dụng Next.js 14/15 App Router với TypeScript strict mode, Tailwind CSS, ESLint và cấu trúc thư mục chuẩn theo `architecture.md` và `project.md`.

### Dependencies
- `TASK-000`

### Required Context
- `AGENTS.md`
- `CODEX.md`
- `docs/architecture.md`
- `docs/coding_standards.md`
- `docs/project.md`

### In Scope
- Khởi tạo Next.js App Router project trong thư mục root.
- Cấu hình TypeScript với `strict: true`.
- Cấu hình Tailwind CSS theo màu sắc và design tokens trong `ui.md`.
- Cấu hình path alias `@/*` trỏ tới `src/*`.
- Tạo cấu trúc thư mục `src/app`, `src/components`, `src/features`, `src/lib`, `src/shared`.
- Tạo file `.env.example`.

### Out of Scope
- Viết UI components cụ thể hay kết nối Supabase.

### Files Allowed to Change
- `package.json`
- `tsconfig.json`
- `tailwind.config.js` / `tailwind.config.ts`
- `postcss.config.js`
- `eslint.config.js`
- `.env.example`
- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/app/globals.css`

### Acceptance Criteria
- [ ] Run `npm run lint` pass 100% không warning/error.
- [ ] Run `npm run typecheck` pass 100%.
- [ ] Run `npm run build` thành công xuất ra `.next`.
- [ ] Cấu trúc thư mục đúng với mô tả trong `project.md`.

### Required Commands
- `npm run lint`
- `npm run typecheck`
- `npm run build`

---

## TASK-002 — Configure Testing Setup (Vitest & Playwright)

### Status
READY

### Owner
Codex

### Reviewer
Gemini / Antigravity

### Feature ID
System Foundation

### Objective
Cấu hình Vitest cho Unit/Integration testing và Playwright cho E2E testing theo `testing.md`.

### Dependencies
- `TASK-001`

### Required Context
- `AGENTS.md`
- `CODEX.md`
- `docs/testing.md`

### In Scope
- Cài đặt và cấu hình `vitest`, `@testing-library/react`.
- Tạo file `vitest.config.ts`.
- Cài đặt và cấu hình `playwright`.
- Tạo file `playwright.config.ts`.
- Thêm test scripts vào `package.json` (`test`, `test:e2e`).
- Viết 1 sample unit test và 1 sample playwright test đơn giản để verify setup.

### Files Allowed to Change
- `package.json`
- `vitest.config.ts`
- `playwright.config.ts`
- `tests/setup.ts`
- `src/shared/utils/sample.test.ts`
- `tests/e2e/sample.spec.ts`

### Acceptance Criteria
- [ ] Run `npm run test` (Vitest) thi hành thành công sample test.
- [ ] Run `npm run test:e2e` (Playwright) thi hành thành công sample test.
- [ ] Code coverage report hoạt động.

### Required Commands
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`

---

## TASK-003 — Primitive UI Components Foundation

### Status
READY

### Owner
Codex

### Reviewer
Gemini / Antigravity

### Feature ID
UI System

### Objective
Xây dựng bộ Primitive UI Components cơ bản (`Button`, `Input`, `Card`, `Badge`) tuân thủ `ui.md` và accessibility.

### Dependencies
- `TASK-001`

### Required Context
- `AGENTS.md`
- `CODEX.md`
- `docs/ui.md`

### In Scope
- Tạo `Button` component hỗ trợ các variants (primary, secondary, outline, ghost, danger) và loading state.
- Tạo `Input` component hỗ trợ label, error text, helper text, focus ring.
- Tạo `Card` component hỗ trợ header, body, footer.
- Tạo `Badge` component hỗ trợ các trạng thái status/difficulty.
- Viết unit tests cho các component này.

### Files Allowed to Change
- `src/components/ui/button.tsx`
- `src/components/ui/button.test.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/input.test.tsx`
- `src/components/ui/card.tsx`
- `src/components/ui/card.test.tsx`
- `src/components/ui/badge.tsx`
- `src/components/ui/badge.test.tsx`
- `src/shared/utils/cn.ts`

### Acceptance Criteria
- [ ] Tất cả UI components đều hỗ trợ `className` tùy biến qua helper `cn()`.
- [ ] Button có hiển thị hiệu ứng Loading và disable khi `isLoading = true`.
- [ ] Unit tests cho 4 components pass 100%.
- [ ] Run quality gates pass.

### Required Commands
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`

---

## TASK-010 — Database Migrations: Core Tables

### Status
READY

### Owner
Codex

### Reviewer
Gemini / Antigravity

### Feature ID
Database Foundation

### Objective
Tạo các file SQL Migration khởi tạo toàn bộ Enums và Tables cho Core MVP trong thư mục `supabase/migrations/` theo đúng `database.md`.

### Dependencies
- `TASK-001`

### Required Context
- `AGENTS.md`
- `CODEX.md`
- `docs/database.md`

### In Scope
- Tạo SQL migration tạo tất cả Postgres Enums (`user_role`, `exercise_type`, `progress_status`...).
- Tạo SQL migration tạo các bảng: `profiles`, `courses`, `chapters`, `lessons`, `exercises`, `exercise_options`, `exercise_solutions`, `course_enrollments`, `user_progress`, `submissions`, `ai_explanations`.
- Tạo các Indexes bắt buộc theo section 8 của `database.md`.
- Thêm `seed.sql` khởi tạo 1 khóa học mẫu `Python for Beginners` kèm bài học & bài tập mẫu.

### Files Allowed to Change
- `supabase/migrations/*`
- `supabase/seed.sql`

### Acceptance Criteria
- [ ] Các file SQL tuân thủ chính xác kiểu dữ liệu và constraints trong `database.md`.
- [ ] Bảng `exercise_solutions` tách biệt khỏi `exercises`.
- [ ] Có đầy đủ Foreign Key constraints với `ON DELETE` rules chuẩn.

### Required Commands
- `npm run lint`

---

## TASK-011 — Database Migrations: RLS Policies & Security

### Status
READY

### Owner
Codex

### Reviewer
Gemini / Antigravity

### Feature ID
Security Foundation

### Objective
Viết SQL Migration cấu hình Row Level Security (RLS) policies cho tất cả các bảng trong database theo `security.md` và `database.md`.

### Dependencies
- `TASK-010`

### Required Context
- `AGENTS.md`
- `CODEX.md`
- `docs/database.md`
- `docs/security.md`

### In Scope
- Enable RLS (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`) cho 100% các bảng public.
- Cấu hình policy cho `profiles` (User xem/sửa profile của chính mình).
- Cấu hình policy cho `courses`, `chapters`, `lessons`, `exercises`, `exercise_options` (Public read nếu `is_published = true`).
- **Tuyệt đối KHÔNG cấp policy SELECT cho `exercise_solutions` cho role anon/authenticated**.
- Cấu hình policy cho `course_enrollments`, `user_progress`, `submissions`, `ai_explanations` (Chỉ user sở hữu được đọc).

### Files Allowed to Change
- `supabase/migrations/*`

### Acceptance Criteria
- [ ] 100% bảng public được enable RLS.
- [ ] Bảng `exercise_solutions` hoàn toàn khóa với client.
- [ ] SQL RLS Syntax hợp lệ.

### Required Commands
- `npm run lint`

---

## TASK-012 — Core Database RPC Functions & Supabase Types

### Status
READY

### Owner
Codex

### Reviewer
Gemini / Antigravity

### Feature ID
Database & API Foundation

### Objective
Tạo các SQL RPC Functions nguyên tử (`enroll_course`, `submit_exercise`) và cấu hình Supabase SSR Clients kèm TypeScript types.

### Dependencies
- `TASK-011`

### Required Context
- `AGENTS.md`
- `CODEX.md`
- `docs/database.md`
- `docs/api_contract.md`

### In Scope
- Tạo SQL migration chứa RPC `enroll_course` (khởi tạo enrollment & user_progress nguyên tử).
- Tạo SQL migration chứa RPC `submit_exercise` (chấm bài, lưu submission, complete lesson & unlock lesson tiếp theo nguyên tử).
- Tạo Supabase Clients (`src/lib/supabase/client.ts`, `server.ts`, `admin.ts`).
- Tạo file TypeScript definitions `src/generated/database.types.ts`.

### Files Allowed to Change
- `supabase/migrations/*`
- `src/lib/supabase/client.ts`
- `src/lib/supabase/server.ts`
- `src/lib/supabase/admin.ts`
- `src/generated/database.types.ts`

### Acceptance Criteria
- [ ] Client `admin.ts` không bị import vào bất kỳ Client Component nào.
- [ ] TypeScript types khớp với schema DB.
- [ ] Quality gates pass.

### Required Commands
- `npm run lint`
- `npm run typecheck`
- `npm run build`
