# TASK-035 — Self-service Password Recovery

## Status
`IN_PROGRESS` — blockers đã được gỡ bằng ADR-024 (Accepted); implementation + tests đang hoàn tất

## Feature ID
`F-AUTH-04`

## Objective
Cung cấp luồng quên mật khẩu và đặt mật khẩu mới qua Supabase Auth mà không tiết lộ tài khoản tồn tại hay đưa credential vào database ứng dụng.

## Dependencies
- `TASK-020` and `TASK-021` verified.

## Required Context
- `docs/features.md` — F-AUTH-04
- `docs/architecture.md` — Supabase Auth boundary
- `docs/security.md` — authentication, rate limiting and secrets
- `docs/api_contract.md`
- Supabase SSR recovery semantics used by the installed version

## Contract Decisions (locked by ADR-024 — Accepted, xem `docs/decisions.md`)
- Route/API names: `POST /api/auth/forgot-password`, `GET /forgot-password`, `GET /reset-password`.
- Redirect allowlist: `originAncestors`/`redirectTo` dùng `NEXT_PUBLIC_APP_URL` (config tồn tại ở `src/lib/env.ts`, allowlist local, Preview, Production theo môi trường).
- Flow: server-mediated — server `POST` gọi `supabase.auth.resetPasswordForEmail`; client state dùng URL search param `state=recovery`.
- Rate limit: 5/giờ/IP/IPv6 và 10/giờ/email; response generic (200) chống account enumeration; inactive user vẫn nhận response generic (no leak).

## Planned Scope
- Forgot-password form và generic success state.
- Recovery callback/session validation.
- Reset-password form với policy hiện có và session invalid/expired state.
- Rate limiting, safe logging và tests không gọi email provider thật.

## Out of Scope
- Lưu password/reset token trong `profiles` hoặc bảng ứng dụng.
- Admin đặt một password cụ thể cho user.
- Email template branding ngoài cấu hình tối thiểu cần cho flow.

## Acceptance Criteria
- Response không xác nhận email có tồn tại hay không.
- Redirect chỉ dùng origin được allowlist.
- Token hết hạn/sai bị từ chối an toàn; password mới tuân policy.
- Không log password, token, cookie hoặc recovery URL chứa token.
- Tests bao phủ abuse, invalid session, happy path và error states.

## Required Commands
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run test:e2e`
- `npm run build`
