# TASK-038 — Security and RLS Regression Hardening — Implementation Report

## Outcome

TASK-038 implemented and verified. The authentication flow now rejects inactive accounts consistently, shared session helpers enforce the active-account guard for subsequent private requests, and abuse-control throttling was added for login, register, AI explanation, and moderation mutation routes.

## Status Final

`VERIFIED`

## Objective Recap

Provide release-grade evidence for authentication, authorization, RLS, server-only data handling, and abuse controls while removing the highest-severity gaps in the current security scope.

## Files Changed

- `src/features/auth/auth.service.ts` — active-account enforcement for login/current-user checks and safe profile lookup fallback handling.
- `src/lib/auth/session.ts` — shared session helper now rejects inactive accounts in protected request flows.
- `src/lib/rate-limiter.ts` — atomic Postgres-backed production limits with hashed identifiers and local/test isolation.
- `src/app/api/auth/login/route.ts` — login rate limiting.
- `src/app/api/auth/register/route.ts` — register rate limiting.
- `src/app/api/ai/explanations/route.ts` — AI explanation throttling.
- `src/app/api/moderation/generated-exercises/route.ts` — moderation authorization and mutation throttling.
- `src/app/api/moderation/generated-exercises/[id]/reviews/route.ts` — moderation review throttling.
- `src/app/api/moderation/generated-exercises/[id]/publish/route.ts` — moderation publish throttling.
- `src/features/auth/auth.service.test.ts`, `src/lib/auth/session.test.ts`, `src/lib/rate-limiter.test.ts`, `src/app/api/auth/auth-routes.test.ts` — regression coverage for inactive-account rejection and 429 behavior.
- `supabase/migrations/017_add_distributed_rate_limits.sql` — private RLS-enabled counter table and service-role-only RPC.
- `supabase/tests/task_038_rls.sql` — executable cross-user RLS, grants, solution-denial, and limiter atomicity assertions.
- `src/generated/database.types.ts` — typed `consume_rate_limit` RPC contract.
- `docs/security.md`, `docs/database.md`, `tasks/TASK-038.md`, `project/TASKS.md` — evidence, database contract, and task registry updates.

## Key Decisions

1. **Server-side active-account guard**: inactive users are blocked both at login and on subsequent authenticated requests through the shared session helper.
2. **Distributed abuse control**: production route handlers use one atomic Postgres RPC shared by Vercel instances; raw IP/user identifiers are SHA-256 hashed before storage.
3. **Least privilege**: the counter table lives in `private`, RLS is enabled, and RPC execution is granted only to `service_role`.
4. **Fail closed**: production limiter storage failure denies the protected request for 60 seconds rather than silently bypassing throttling.
5. **Regression-first security**: route and SQL integration tests capture inactive-account, RLS isolation, grants, and 429 behavior.

## Quality Gates

| Gate | Result |
|---|---|
| `npm run lint` | PASS |
| `npm run typecheck` | PASS |
| Combined targeted regression suite | PASS — 58/58 tests |
| `npm run test` | PASS — 408/408 tests across 174 suites |
| Supabase local reset + SQL assertions | PASS — migrations `001–017`, RLS isolation and atomic limiter verified |
| Supabase DB lint/advisors | PASS — no issues |
| `npm run build` | PASS — production build completed successfully |
