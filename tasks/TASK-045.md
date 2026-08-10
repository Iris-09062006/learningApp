# TASK-045 — Reduce Page Navigation Latency

## Status
`VERIFIED`

## Objective
Reduce real and perceived latency during App Router navigation without weakening authentication or authorization.

## In Scope
- Avoid Supabase page-session middleware on API routes that enforce their own JSON auth contract.
- Verify protected page sessions with Supabase signed-JWT claims.
- Provide immediate route-level loading feedback.
- Add regression tests and run all quality gates.

## Out of Scope
- Visual redesign, persistent cross-user caching, deployment, or push.

## Acceptance Criteria
- API requests bypass page redirect/session middleware.
- Protected pages remain protected and public pages remain public.
- Navigation has an accessible immediate loading state.
- `lint`, `typecheck`, `test`, `build`, and `git diff --check` pass.

## Required Commands
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- `git diff --check`
