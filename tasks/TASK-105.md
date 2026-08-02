# TASK-105: Role-Based Access Control (Student/Parent/Admin)

## Status: READY
## Phase: Phase 1 — Core Authentication & User Management
## Priority: Medium
## Assignee: —

## Objective

Triển khai hệ thống phân quyền theo role, đảm bảo mỗi role chỉ truy cập được resources phù hợp.

## Scope

### Trong scope
- Utility functions kiểm tra role (`isStudent()`, `isParent()`, `isAdmin()`)
- Server-side role check trong Server Actions và Server Components
- Client-side role check hook
- Dashboard redirect theo role
- Conditional UI rendering theo role
- Role guard component/HOC

### Ngoài scope
- Admin CRUD operations (Phase 5)
- Parent-specific features (Phase 5)
- Granular permissions beyond role-based

## Dependencies
- TASK-102: Auth Logic ✅
- TASK-103: Route Protection ✅
- TASK-104: Profile Management ✅

## Required Context
- `docs/security.md` — Authorization rules
- `docs/requirements.md` §2.1 — Role definitions
- `src/generated/db-types.ts` — Role types
- `src/shared/constants/database.ts` — USER_ROLES constant

## Acceptance Criteria
- [ ] Role utility functions hoạt động chính xác
- [ ] Server Components kiểm tra role trước khi render
- [ ] Client hook `useRole()` trả về role hiện tại
- [ ] Dashboard layout thay đổi theo role
- [ ] Unauthorized access → redirect hoặc 403
- [ ] Lint, typecheck, build pass
- [ ] Tests cho role utilities và hooks

## Technical Notes
- Role utilities tại `src/features/auth/utils/roles.ts`
- Role hook tại `src/features/auth/hooks/useRole.ts`
- Role guard component tại `src/features/auth/components/RoleGuard.tsx`
- Role lấy từ `profiles` table, không phải JWT (trừ khi setup custom claims)
- Student: truy cập learning, exercises, AI chat
- Parent: truy cập parent dashboard, child monitoring
- Admin: truy cập admin dashboard, CRUD content

## Files Expected to Change
- `src/features/auth/utils/roles.ts`
- `src/features/auth/hooks/useRole.ts`
- `src/features/auth/components/RoleGuard.tsx`
- Update middleware nếu cần
- Tests

## Required Commands
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run test`