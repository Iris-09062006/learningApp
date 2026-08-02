# TASK-103: Auth Middleware & Route Protection

## Status: READY
## Phase: Phase 1 — Core Authentication & User Management
## Priority: High
## Assignee: —

## Objective

Thiết lập route protection: redirect user chưa đăng nhập về login, user đã đăng nhập không vào auth pages, và phân quyền theo role.

## Scope

### Trong scope
- Cập nhật `src/middleware.ts` để kiểm tra auth status
- Redirect logic: unauthenticated → `/login`, authenticated → dashboard
- Prevent authenticated users from accessing `/login`, `/register`
- Protected route wrapper/layout cho dashboard
- Role-based redirect (student → student dashboard, parent → parent dashboard, admin → admin dashboard)
- Helper function kiểm tra role

### Ngoài scope
- API route protection (sẽ dùng RLS)
- Granular permission system
- Admin-only routes (Phase 5)

## Dependencies
- TASK-102: Auth Logic ✅
- TASK-021: Supabase Client Utilities ✅

## Required Context
- `docs/security.md` — Route protection requirements
- `docs/architecture.md` §5 — Auth flow
- `src/middleware.ts` — Current middleware
- `src/lib/supabase/middleware.ts` — Session update logic

## Acceptance Criteria
- [ ] User chưa login truy cập protected route → redirect `/login`
- [ ] User đã login truy cập `/login` hoặc `/register` → redirect dashboard
- [ ] Role-based routing hoạt động
- [ ] Middleware không block static assets, API routes, public pages
- [ ] Session refresh vẫn hoạt động
- [ ] Lint, typecheck, build pass
- [ ] Tests cho middleware logic

## Technical Notes
- Mở rộng `updateSession()` hoặc thêm logic trong `middleware.ts`
- Dùng `supabase.auth.getUser()` để kiểm tra auth status
- Query profile table để lấy role (hoặc dùng JWT custom claims nếu đã setup)
- Public routes: `/`, `/login`, `/register`, `/about`
- Protected routes: `/dashboard/**`, `/profile/**`

## Files Expected to Change
- `src/middleware.ts` — Thêm route protection logic
- `src/lib/supabase/middleware.ts` — Có thể mở rộng
- `src/app/(dashboard)/layout.tsx` — Protected layout
- Tests cho middleware

## Required Commands
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run test`