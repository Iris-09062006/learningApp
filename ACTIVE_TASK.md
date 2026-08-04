# Active Task: TASK-028 (AI Mentor API and Explanation Service)

## Status
`VERIFIED`

## Summary
- [x] Tạo AI Provider layer (`ai-provider.ts`) hỗ trợ Google Gemini hoặc Dummy model fallback.
- [x] Tạo `AiRepository` thao tác với `ai_explanations`.
- [x] Tạo `AiService` chịu trách nhiệm tạo giải thích và lưu DB.
- [x] Tạo các API routes:
  - `POST /api/ai/explanations`
  - `GET /api/submissions/[submissionId]/explanations`
- [x] Tích hợp AI Explanation View vào `exercise-view.tsx`.
- [x] Cấu hình Vitest server-only alias (`tests/server-only.ts`).
- [x] 100% tests PASS (235/235 tests).
- [x] Quality gates (lint, typecheck, build) PASS.