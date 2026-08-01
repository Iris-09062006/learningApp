# Development Roadmap

## 1. Tổng quan lộ trình

Lộ trình phát triển dự án **LearningApp** được chia thành 8 Phase (từ Phase 0 đến Phase 7) với mục tiêu hoàn thiện từng phần kiến trúc, nền tảng dữ liệu, tính năng học tập cốt lõi (Core MVP) trước khi mở rộng các tính năng kiểm duyệt và quản trị (Operations Extension).

```text
Phase 0: Documentation & Agent Workflow (Hoàn thành)
   │
   ▼
Phase 1: Project Foundation & Quality Gates
   │
   ▼
Phase 2: Database & Auth Foundation (Supabase)
   │
   ▼
Phase 3: Authentication & Learning Core (Course, Catalog, Roadmap)
   │
   ▼
Phase 4: Exercises, Submissions & Progress Engine
   │
   ▼
Phase 5: AI Mentor Integration (Server-side AI Explanation)
   │
   ▼
Phase 6: Operations Extension (AI Generation, Moderation, Admin)
   │
   ▼
Phase 7: Hardening, Security Regression & Deployment (Vercel)
```

---

## 2. Chi tiết các Phase phát triển

### Phase 0 — Documentation & Agent Workflow (ĐÃ HOÀN THÀNH)
- [x] Chuẩn hóa toàn bộ tài liệu thiết kế trong `docs/` (`requirements`, `architecture`, `database`, `api_contract`, `security`, `testing`, `ui`, `features`, `decisions`).
- [x] Xây dựng quy tắc làm việc cho AI Agent (`AGENTS.md`, `CODEX.md`, `GEMINI.md`).
- [x] Thiết lập Task board ban đầu trong `TASKS.md`.

---

### Phase 1 — Project Foundation & Quality Gates
- **Mục tiêu:** Bootstrap dự án Next.js, cấu hình TypeScript strict, Tailwind CSS, Vitest, Playwright và CI Quality Gates.
- **Các Task chính:**
  - `TASK-001`: Bootstrap Next.js 14/15 App Router với TypeScript, ESLint, Prettier, Tailwind CSS.
  - `TASK-002`: Cấu hình môi trường kiểm thử Vitest và Playwright.
  - `TASK-003`: Xây dựng Primitive UI Components cơ bản (`Button`, `Input`, `Card`, `Badge`...) theo `ui.md`.

---

### Phase 2 — Database & Auth Foundation
- **Mục tiêu:** Khởi tạo Supabase local, chạy migrations tạo bảng Core MVP, cấu hình RLS policies, RPC functions và Generate Supabase Types.
- **Các Task chính:**
  - `TASK-010`: SQL Migrations tạo Enums, `profiles`, `courses`, `chapters`, `lessons`.
  - `TASK-011`: SQL Migrations tạo `exercises`, `exercise_options`, `exercise_solutions` (server-only).
  - `TASK-012`: SQL Migrations tạo `course_enrollments`, `user_progress`, `submissions`, `ai_explanations`.
  - `TASK-013`: Cấu hình RLS Policies cho tất cả các bảng Core MVP.
  - `TASK-014`: Viết RPC Functions nguyên tử (`enroll_course`, `submit_exercise`).
  - `TASK-015`: Cấu hình Supabase SSR Clients (`client.ts`, `server.ts`, `admin.ts`) & Generate Types.

---

### Phase 3 — Authentication & Learning Core
- **Mục tiêu:** Hoàn thiện luồng Đăng ký, Đăng nhập, Xem Course Catalog, Enroll và hiển thị Roadmap trực quan.
- **Các Task chính:**
  - `TASK-020`: Triển khai Auth Service & API Routes (`register`, `login`, `logout`, `me`).
  - `TASK-021`: Màn hình Đăng ký / Đăng nhập (Auth Layout & Forms).
  - `TASK-022`: Course Catalog Service & Pages (`/courses`, `/courses/:id`).
  - `TASK-023`: Enrollment Service (`POST /api/courses/:id/enroll`).
  - `TASK-024`: Visual Roadmap Component & Page (`/courses/:id/roadmap`) theo chuẩn `ui.md`.

---

### Phase 4 — Exercises, Submissions & Progress Engine
- **Mục tiêu:** Xây dựng màn hình đọc bài học, làm bài tập Predict Output / Fix Bug, chấm bài server-side và tự động mở khóa bài học tiếp theo.
- **Các Task chính:**
  - `TASK-030`: Lesson Service & Page (`/lessons/:id`).
  - `TASK-031`: Exercise Shell Component & Evaluators (Predict Output & Fix Bug MVP).
  - `TASK-032`: Submission Service (`POST /api/exercises/:id/submissions`) tích hợp RPC chấm bài.
  - `TASK-033`: Progress Engine & Tự động mở khóa bài học tiếp theo (Unlock Next Lesson).
  - `TASK-034`: Feedback Panel Component (Chính xác / Chưa chính xác).

---

### Phase 5 — AI Mentor Integration
- **Mục tiêu:** Triển khai tích hợp AI Mentor phía Server để giải thích đáp án sai dựa trên bối cảnh.
- **Các Task chính:**
  - `TASK-040`: AI Integration Layer (`ai-provider.interface`, `prompt-builder`, `response-validator`).
  - `TASK-041`: Gemini Provider Implementation & Fake Provider Mock cho testing.
  - `TASK-042`: AI Explanation Service (`POST /api/ai/explanations`).
  - `TASK-043`: AI Mentor Drawer Component (UI Slide-over & Bottom Sheet) theo `ui.md`.

---

### Phase 6 — Operations Extension (P1 Features)
- **Mục tiêu:** Mở rộng các tính năng kiểm duyệt bài tập AI cho Moderator và quản trị người dùng cho Admin.
- **Các Task chính:**
  - `TASK-050`: Migration & Schema cho `generated_exercises`, `exercise_reviews`, `admin_logs`.
  - `TASK-051`: AI Exercise Generation Service (`F-AIGEN-01`).
  - `TASK-052`: Moderator Queue & Review Pages (`/moderator/queue`, `/moderator/review/:id`).
  - `TASK-053`: Publish Generated Exercise Service (`POST /api/moderation/generated-exercises/:id/publish`).
  - `TASK-054`: Admin User Management Pages & Role Changing (`/admin/users`).

---

### Phase 7 — Hardening, Security Regression & Deployment
- **Mục tiêu:** Kiểm tra bảo mật RLS toàn diện, E2E test critical flows, kiểm tra accessibility và deploy phiên bản Production lên Vercel.
- **Các Task chính:**
  - `TASK-060`: Security & RLS Regression Testing Suite.
  - `TASK-061`: Critical User Flows Playwright E2E Test Suite.
  - `TASK-062`: Performance & Accessibility Audit.
  - `TASK-063`: Production Deployment Checklist & Vercel Configuration.
