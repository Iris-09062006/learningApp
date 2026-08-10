# TASK-046 — Stabilize AI Content Pipeline and New Lesson Targets

## Status
`VERIFIED`

## Objective
Prevent HTML/non-JSON responses from breaking the Admin content pipeline, settle loading states reliably, and let Admins create a new unpublished target lesson instead of overwriting an existing lesson.

## In Scope
- Parse application and provider responses defensively with actionable errors.
- Clear stale loading messages on every path.
- Add an Admin-only API/RPC that creates an unpublished lesson target in a selected chapter with the next valid order.
- Add existing/new target modes to the content UI.
- Update contracts, tests, and reports.

## Out of Scope
- Autonomous publication, new course/chapter creation, broad visual redesign, deployment, or push.

## Acceptance Criteria
- HTML/malformed responses never expose `Unexpected token '<'`.
- Initial loading cannot remain stuck after failure.
- Admin can create a named lesson in an existing chapter and generate against it.
- Target creation is authorized and concurrency-safe.
- `lint`, `typecheck`, `test`, `build`, and `git diff --check` pass.

## Required Commands
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- `git diff --check`
