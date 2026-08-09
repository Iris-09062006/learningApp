# TASK-039 — Critical-flow E2E and Accessibility

## Status
`VERIFIED`

## Phase
Phase 7

## Objective
Thay placeholder Playwright bằng regression suite cho critical learner flows và xác minh accessibility trên các màn hình chính.

## Dependencies
- `TASK-038` verified.
- Deterministic local seed/fixtures and mock AI provider.

## Required Context
- `docs/testing.md` — three required E2E flows
- `docs/ui.md`
- `docs/coding_standards.md`
- `playwright.config.ts`

## In Scope
- E2E: register/login and dashboard.
- E2E: catalog → enroll → roadmap → lesson → correct submission → next lesson unlock.
- E2E: wrong submission → AI explanation loading/success using mock provider.
- Role-route smoke coverage for Moderator/Admin.
- Keyboard-only navigation, focus visibility/order, labels, headings, landmarks, error/status announcements and contrast review.
- Stable fixtures/selectors; no skipped/flaky retries used to hide defects.

## Out of Scope
- Calling a paid/real AI provider.
- Visual redesign unrelated to accessibility findings.
- Cross-browser expansion beyond Chromium until the baseline suite is stable.

## Acceptance Criteria
- Placeholder-only E2E is replaced or supplemented by all three required flows. ✅
- E2E data is isolated and repeatable. ✅ Local mock Supabase state resets per test and never uses `.env.local` remote values.
- No Critical/Serious automated accessibility violations on scoped pages; manual keyboard checklist passes. ✅ Axe WCAG 2 A/AA + keyboard-only registration/login flow passed.
- Failure artifacts preserve trace/screenshot without exposing secrets. ✅ `retain-on-failure` trace and `only-on-failure` screenshots, with local dummy credentials only.

## Verification Evidence
- Three required learner flows and Moderator/Admin route smoke coverage pass on Chromium with `retries: 0`.
- Course → roadmap → lesson → exercise navigation is complete; correct submission unlocks Lesson 2.
- Wrong-answer flow announces mock AI loading/success and shows the AI-content disclaimer.
- Automated accessibility review found and fixed contrast issues in auth, navigation, roadmap, AI metadata and shared buttons.
- Required commands pass; review verdict is `PASS` with no remaining Critical/High/Medium findings.

## Required Commands
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run test:e2e`
- `npm run build`

## Implementation Plan
- Chạy ứng dụng E2E với fixture server cục bộ, không đọc/ghi Supabase remote và không gọi AI provider thật.
- Bổ sung các route/link UI còn thiếu để critical learner flow có thể đi xuyên suốt bằng semantic selectors.
- Thêm ba flow bắt buộc, role-route smoke tests và kiểm tra accessibility/keyboard trên Chromium.
- Lưu screenshot/trace khi thất bại, review diff và lặp lại quality gates đến khi PASS.

## Files Allowed to Change
- `playwright.config.ts`, `package.json`, `package-lock.json`.
- `tests/e2e/**`, `tests/fixtures/**`, `tests/helpers/**`.
- Các page/component/test trực tiếp cần thiết để hoàn thiện critical flow và sửa finding accessibility trong scope.
- `ACTIVE_TASK.md`, `project/TASKS.md`, `tasks/TASK-039.md`, `reports/TASK-039-*.md`.
