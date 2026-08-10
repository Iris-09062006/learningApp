# TASK-044 Implementation Report

## Outcome

The application-side redirect defect is fixed. Preview signup now passes an explicit
confirmation redirect based on Vercel's server-controlled deployment URL, while
Production/configured environments use `NEXT_PUBLIC_SITE_URL` and local development
uses `http://localhost:3000`.

## Changes
- Added a shared HTTP(S)-only auth redirect-origin resolver.
- Signup confirmation redirects to `/login` on the resolved origin.
- Password recovery redirects to `/reset-password` through the same resolver.
- Added regression coverage for Preview, configured site and localhost fallback.

## External configuration

Supabase requires the requested redirect to match Auth Redirect URLs. No available
MCP tool can manage Auth URL Configuration, no authenticated browser is available,
and `supabase config push` is too broad because it may overwrite unrelated Auth
settings. The required Preview allowlist entry is:

`https://*-iris-projects-bcfa9d19.vercel.app/**`

The existing local entry should remain: `http://localhost:3000/**`.

## Files changed
- `src/features/auth/auth.service.ts`
- `src/features/auth/auth.service.test.ts`
- `tasks/TASK-044.md`
- `ACTIVE_TASK.md`
- `project/TASKS.md`
- TASK-044 reports

