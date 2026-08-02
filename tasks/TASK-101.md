# TASK-101: Auth UI — Login / Register Pages

## Status: READY
## Phase: Phase 1 — Core Authentication & User Management
## Priority: High
## Assignee: —

## Objective

Xây dựng giao diện đăng nhập và đăng ký cho LearningApp, bao gồm form validation, error handling, và responsive design.

## Scope

### Trong scope
- Trang `/login` với form email + password
- Trang `/register` với form đăng ký (email, password, full_name, role selection)
- Form validation (client-side)
- Error display (invalid credentials, email already exists, etc.)
- Loading states
- Route group `(auth)` layout
- Link giữa Login ↔ Register
- Responsive design (mobile-first)

### Ngoài scope
- Google OAuth UI (tương lai)
- Forgot password flow
- Email verification UI
- Actual Supabase Auth integration (TASK-102)

## Dependencies
- TASK-020: Project scaffolding ✅
- TASK-022: Database types & constants ✅
- TASK-010A: UI Design System Foundation ✅

## Required Context
- `docs/ui.md` — Design system specifications
- `docs/requirements.md` §2.1 — Auth requirements
- `docs/architecture.md` §3 — Project structure
- `src/shared/constants/` — App constants

## Acceptance Criteria
- [ ] Route group `(auth)` với layout riêng tồn tại
- [ ] Trang `/login` render form email + password
- [ ] Trang `/register` render form với fields: email, password, confirm password, full_name, role
- [ ] Client-side validation hoạt động (required fields, email format, password strength, password match)
- [ ] Error messages hiển thị rõ ràng
- [ ] Loading state khi submit
- [ ] Responsive trên mobile và desktop
- [ ] Lint, typecheck, build pass
- [ ] Có ít nhất 1 test cho mỗi form component

## Technical Notes
- Dùng Server Components cho layout, Client Components cho forms
- Form components đặt tại `src/features/auth/components/`
- Sử dụng React `useActionState` hoặc controlled forms
- Chưa cần kết nối Supabase Auth thực tế (mock action cho form submission)

## Files Expected to Change
- `src/app/(auth)/layout.tsx` — Auth layout
- `src/app/(auth)/login/page.tsx` — Login page
- `src/app/(auth)/register/page.tsx` — Register page
- `src/features/auth/components/LoginForm.tsx`
- `src/features/auth/components/RegisterForm.tsx`
- `src/features/auth/components/AuthCard.tsx` — Shared card wrapper
- Tests cho form components

## Required Commands
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run test`