# TASK-044 — Fix Supabase Auth Email Redirects on Preview

## Status
`BLOCKED`

## Phase
Critical deployment hotfix

## Objective
Ensure signup-confirmation and password-recovery emails redirect to the active
Vercel Preview origin instead of the Supabase localhost Site URL.

## Root Cause
- `AuthService.register()` does not pass `options.emailRedirectTo` to
  `supabase.auth.signUp()`, so Supabase falls back to its configured Site URL.
- Preview redirects must also match the Supabase Auth Redirect URLs allowlist.

## In Scope
- Resolve a server-side auth redirect origin using the active Vercel Preview URL,
  configured site URL, and localhost development fallback.
- Apply the resolver to signup confirmation and password recovery.
- Add focused regression tests for Preview and configured-site behavior.
- Verify Supabase URL Configuration where an authenticated management surface is
  available; otherwise document the exact required allowlist entry.
- Run full quality gates, commit, push a hotfix branch, and deploy a new Preview.

## Out of Scope
- Production promotion or Production URL changes.
- Email-template redesign, SMTP-provider changes, or bypassing Supabase redirect
  validation.
- Modifying unrelated working-tree files.

## Acceptance Criteria
- Preview signup sends `emailRedirectTo` using the current `VERCEL_URL` origin.
- Non-Preview environments prefer `NEXT_PUBLIC_SITE_URL`; local development has
  an explicit localhost fallback.
- Password recovery uses the same resolver and `/reset-password` path.
- Focused tests and `lint`, `typecheck`, `test`, `build`, `git diff --check` pass.
- A clean commit is pushed and a new Vercel Preview reaches `READY`.

## Files Allowed to Change
- `src/features/auth/auth.service.ts`
- `src/features/auth/auth.service.test.ts`
- `tasks/TASK-044.md`, `ACTIVE_TASK.md`, `project/TASKS.md`
- `reports/TASK-044-implementation.md`, `reports/TASK-044-test.md`,
  `reports/TASK-044-review.md`

## Pre-deployment verification
- Root cause reproduced from the deployed code path: signup omitted
  `emailRedirectTo` and therefore used the Supabase localhost Site URL.
- Focused Auth tests cover Preview, configured site, localhost fallback and
  password recovery redirects.
- Local quality gates pass. Clean Preview deployment and live email-link
  verification remain pending.
- Supabase Auth URL Configuration cannot be read or changed through the available
  MCP tools; the in-app browser has no active session, and CLI `config push` is
  intentionally not used because it can overwrite unrelated Auth settings.

## Deployment outcome
- Commit `59b8318` is pushed to `preview/task-044-email-redirect`.
- Vercel Preview `dpl_GcaLxar1dmrsobKc5Yabrtcgftbb` is `READY` at
  `https://learning-11g0rzruv-iris-projects-bcfa9d19.vercel.app`.
- Runtime health reports `database: connected`; the deployment has no warning,
  error or fatal runtime log in the verification window.
- Final email-link verification is blocked until the Supabase Auth Redirect URLs
  allowlist is confirmed and a fresh confirmation email is generated. The expired
  OTP link cannot be reused as evidence.
