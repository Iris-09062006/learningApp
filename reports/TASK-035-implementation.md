# TASK-035 Implementation Report

## Outcome

`IN_PROGRESS` → implementation complete. TASK-035 (Self-service Password Recovery) was unblocked by ADR-024 (Accepted, `docs/decisions.md`), which locked the four previously missing contract decisions. All planned scope implemented, all quality gates pass, review PASS, committed as `6259cd5`.

## Status Final

`VERIFIED` (after review + commit)

## Files Changed

Commit `6259cd5` — 21 files, 829 insertions(+), 14 deletions(-).

| File | Change |
|---|---|
| `src/app/api/auth/forgot-password/route.ts` | New: `POST` handler — rate limiting, schema validation, needs-verification guard, generic 200 response |
| `src/features/auth/auth.service.ts` | Added `forgotPassword` service calling `supabase.auth.resetPasswordForEmail`; guards inactive needs-verification accounts |
| `src/features/auth/auth.schema.ts` | Added `forgotPasswordSchema` (trimmed email, normalizes empty to undefined) |
| `src/features/auth/auth.types.ts` | Added `ForgotPasswordInput`, `ForgotPasswordResult` |
| `src/lib/rate-limiter.ts` | New: scalable IP/identifier rate limiter with `Retry-After` metadata |
| `src/features/auth/components/forgot-password-form.tsx` | New: client form — email input, generic success state, error displayed without enumeration leak |
| `src/app/(auth)/forgot-password/page.tsx` | New: public page, guest-only guard |
| `src/features/auth/components/reset-password-form.tsx` | New: client form — new password + confirm, policy-aware validation, generic error state |
| `src/app/(auth)/reset-password/page.tsx` | New: public page, guest-only guard; reads `state=recovery` from URL |
| `src/features/auth/components/login-form.tsx` | Added "Quên mật khẩu?" link to `/forgot-password` |
| `src/lib/supabase/middleware.ts` | Public matcher extended: `/api/auth/forgot-password`, `/forgot-password`, `/reset-password` |
| `docs/api_contract.md` | Documented `POST /api/auth/forgot-password` per ADR-024: generic response, rate limits, no enumeration |
| `docs/security.md` | Added rate limit row + anti-enumeration rules per ADR-024 |
| `.env.example` | Documented `NEXT_PUBLIC_APP_URL` used for recovery redirect |
| `src/features/auth/auth.service.test.ts` | Added forgotPassword unit tests |
| `src/lib/rate-limiter.test.ts` | New: rate limiter unit tests |
| `src/lib/supabase/middleware.test.ts` | Added public-matcher tests for new routes |
| `tests/e2e/forgot-password.spec.ts` | New: e2e — guest opens page, invalid email validation, login link |
| `tasks/TASK-035.md` | Status → IN_PROGRESS, contract decisions recorded |
| `ACTIVE_TASK.md` | Active task → TASK-035 |
| `project/TASKS.md` | Registry row → IN_PROGRESS |

## Key Decisions

- **Server-mediated flow** (ADR-024): server `POST` calls `supabase.auth.resetPasswordForEmail`; the recovery link arrives via Supabase email; client reads `state=recovery` from the URL.
- **Anti-enumeration**: identical generic `{ submitted: true }` 200 for existing email, non-existing email, and inactive `needs_verification` accounts. No email-provider error details leaked to client or logs.
- **Rate limiting**: 5 requests/IP/hour and 10 requests/email/hour, both returning HTTP 429 with `Retry-After`.
- **Redirect allowlist**: uses `NEXT_PUBLIC_APP_URL` (config already exists in `src/lib/env.ts`) per ADR-024 — no arbitrary redirect parameter.

## Quality Gates (actual results)

| Gate | Command | Result |
|---|---|---|
| Lint | `npm run lint` | PASS (no errors output) |
| Typecheck | `npm run typecheck` | PASS (no errors output) |
| Unit | `npm run test` | PASS — 63 files / 368 tests |
| E2E | `npm run test:e2e` (forgot-password spec) | PASS — 3/3 |
| Build | `npm run build` | PASS — all routes registered |

## Review Verdict

`PASS` — see `reports/TASK-035-review.md`.

## Commit

`6259cd5` — `feat(auth): self-service password recovery flow (TASK-035)`

## Risks / Limitations

- Recovery email delivery depends on the Supabase project's email provider configuration; not exercised in automated tests (per task scope: tests must not call a real email provider).
- Reset-password completion requires the Supabase recovery email link (PKCE implicit flow). E2E covers page/form rendering and validation; full token round-trip is covered by Supabase Auth semantics.