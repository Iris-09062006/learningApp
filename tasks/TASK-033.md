# TASK-033 — User Administration and System Health Dashboard

## Status
`READY`

## Required Context
- `docs/requirements.md`
- `docs/features.md` (Module 16: Admin Module — F-ADMIN-01..05, Module 17: System Module — F-SYSTEM-01)
- `docs/database.md` (§7.1 `profiles`, §7.13 `audit_logs`)
- `docs/api_contract.md`
- `docs/security.md`

## Objectives
1. Implement User Management API (`GET /api/admin/users`, `PATCH /api/admin/users/:userId/role`, `PATCH /api/admin/users/:userId/status`).
2. Build audit logging mechanism when user role or active status is updated.
3. Protect against demoting the final active admin account.
4. Implement System Health API (`GET /api/system/health`) returning application and database connection status.
5. Create Admin Dashboard UI (`/admin/users`, `/admin/system`) with user search, filtering, role/status toggles, and system health status.

## File Scope
- `src/features/admin/types/index.ts`
- `src/features/admin/repositories/admin-repository.ts`
- `src/features/admin/services/admin-service.ts`
- `src/features/admin/components/`
- `src/app/api/admin/`
- `src/app/api/system/`
- `src/app/(main)/admin/`
- `src/features/admin/**/__tests__/`
- `src/app/api/admin/**/__tests__/`
- `src/app/api/system/**/__tests__/`
- `tasks/TASK-033.md`
- `ACTIVE_TASK.md`
- `project/TASKS.md`
- `project/ROADMAP.md`
- `reports/TASK-033-implementation.md`
- `reports/TASK-033-review.md`

## Acceptance Criteria
- `/api/admin/*` endpoints strictly reject non-Admin users with 403 Forbidden.
- User management API allows pagination, text searching by email/username, and filtering by role/active status.
- Role and status modifications generate corresponding `audit_logs` entries.
- System prevents demoting or deactivating the last remaining active Admin user.
- `/api/system/health` returns basic operational status without leaking secret credentials.
- Tests verify authorization enforcement, audit log generation, last-admin protection, and UI components.
- `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build` pass without errors or warnings.

## Non-Goals
- Password management or forced password resets via direct DB write.
- Complex metrics/analytics graphics.