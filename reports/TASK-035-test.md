# TASK-035 Test Report

## Test Scope

Tests added for the self-service password recovery feature:

- **`src/features/auth/auth.service.test.ts`** — `forgotPassword`: calls Supabase `resetPasswordForEmail` with the normalized email; returns generic `{ submitted: true }`; handles missing email; suppresses Supabase recovery errors (no enumeration).
- **`src/lib/rate-limiter.test.ts`** — rate limiter: per-IP buckets, per-identifier buckets, 429 when limit exceeded, `Retry-After` metadata, expired-window reset.
- **`src/lib/supabase/middleware.test.ts`** — public matcher: `/api/auth/forgot-password`, `/forgot-password`, `/reset-password` allowed without session.
- **`tests/e2e/forgot-password.spec.ts`** — e2e: guest opens the forgot-password page; invalid email shows validation error without submitting; login page links to forgot-password.

## Commands and Results

| Gate | Command | Result |
|---|---|---|
| Lint | `npm run lint` | PASS — no errors |
| Typecheck | `npm run typecheck` | PASS — no errors |
| Unit | `npm run test` | PASS — 63 files / 368 tests |
| E2E | `npx playwright test tests/e2e/forgot-password.spec.ts` | PASS — 3/3 |
| Build | `npm run build` | PASS — all routes registered |

## Coverage Notes

- Abuse: rate-limit tests cover IP and email buckets, 429, and `Retry-After`.
- Invalid session / invalid input: e2e invalid-email validation; reset form password-policy + confirmation messages.
- Happy path / error states: `forgotPassword` service unit tests; guest-only page guards; generic success vs error UI states.
- No real email provider invoked in any test (per task scope).