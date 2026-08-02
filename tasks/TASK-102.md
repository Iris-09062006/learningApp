# TASK-102: Auth Logic — Supabase Auth Integration

## Status: READY
## Phase: Phase 1 — Core Authentication & User Management
## Priority: High
## Assignee: —

## Objective

Tích hợp Supabase Auth cho login/register/logout, kết nối với UI từ TASK-101. Xử lý session management và auth state.

## Scope

### Trong scope
- Server Actions cho login (email + password)
- Server Actions cho register (email + password + metadata)
- Server Action cho logout
- Auth error handling (invalid credentials, duplicate email, weak password, etc.)
- Session management via cookies (đã có middleware từ Phase 0)
- Auth state context/hook cho Client Components
- Redirect logic sau login/register/logout
- Profile auto-creation verification (trigger `handle_new_user` đã có trong migration)

### Ngoài scope
- Google OAuth
- Forgot password / Reset password
- Email verification enforcement
- Admin-specific auth logic

## Dependencies
- TASK-101: Auth UI ✅ (hoặc có thể phát triển song song)
- TASK-021: Supabase Client Utilities ✅
- TASK-022: Database Types ✅

## Required Context
- `docs/security.md` — Security requirements
- `docs/architecture.md` §5 — Authentication flow
- `src/lib/supabase/server.ts` — Server client
- `src/lib/supabase/client.ts` — Browser client
- `src/lib/supabase/middleware.ts` — Session refresh
- `src/middleware.ts` — Next.js middleware
- `supabase/migrations/00001_initial_schema.sql` — Profile trigger

## Acceptance Criteria
- [ ] Login với email+password hoạt động qua Server Action
- [ ] Register tạo user và auto-create profile
- [ ] Logout xóa session và redirect về login
- [ ] Error messages chính xác cho từng loại lỗi auth
- [ ] Session persist qua page reload
- [ ] Auth state accessible trong Client Components
- [ ] Redirect đúng: login → dashboard, logout → login
- [ ] Lint, typecheck, build pass
- [ ] Unit tests cho Server Actions

## Technical Notes
- Server Actions tại `src/features/auth/actions/`
- Auth hooks tại `src/features/auth/hooks/`
- Không dùng Supabase `onAuthStateChange` trong Server Components
- Client Components dùng `createClient()` từ `@/lib/supabase/client`
- Server Actions dùng `createClient()` từ `@/lib/supabase/server`

## Files Expected to Change
- `src/features/auth/actions/login.ts`
- `src/features/auth/actions/register.ts`
- `src/features/auth/actions/logout.ts`
- `src/features/auth/hooks/useUser.ts` — Hook lấy current user
- Update `src/features/auth/components/LoginForm.tsx` — Connect to actions
- Update `src/features/auth/components/RegisterForm.tsx` — Connect to actions
- Tests cho actions

## Required Commands
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run test`