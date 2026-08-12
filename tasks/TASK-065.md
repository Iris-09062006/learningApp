# TASK-065 — Retry Invalid Course Outline Generation

## Status
`IN_PROGRESS`

## Owner / Reviewer
Codex / Codex

## Objective
Make Course-outline generation resilient when a configured AI provider returns HTTP 200 but its
first structured response violates server-side business invariants.

## Evidence
- Production sources 23 and 24 extract successfully, then fail with `OUTLINE_GENERATION_FAILED`.
- The configured provider returns HTTP 200 and a valid Course outline for synthetic source data.
- The affected source is an exercise sheet; outline generation currently makes one attempt and
  maps all provider/schema/business-validation failures to one generic client response.

## Scope
- Retry Course-outline generation once only when the first response is structurally or
  semantically invalid.
- Use a correction prompt that restates server-authoritative constraints and permits deriving
  teachable prerequisite concepts from exercise-oriented source material without copying tasks or
  solutions.
- Preserve provider HTTP failures, timeouts, authentication, rate limits, generic client errors,
  strict validation, and source-reference ownership.
- Emit bounded metadata-only diagnostics without source text or generated content.
- Add regression tests, run all gates, review, commit, push, and deploy production.

## Acceptance Criteria
- [x] A valid first response still uses one provider request.
- [x] An invalid first response is retried once with explicit correction constraints.
- [x] A valid retry is accepted; a second invalid response remains a generic `AI_PROVIDER_ERROR`.
- [x] No PDF/source text, generated output, filename, credential, or token is logged.
- [x] Required quality gates and review pass.
- [x] Fix is pushed and deployed; production outline retry is ready for user verification.

## Required Commands
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- `git diff --check`
