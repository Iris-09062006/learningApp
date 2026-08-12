# TASK-066 — Normalize Single-Chunk Lesson Citations

## Status
`IN_PROGRESS`

## Owner / Reviewer
Codex / Codex

## Objective
Make Lesson-content generation resilient when a provider returns 1-based or duplicate integer
citations for a document with exactly one server-owned source chunk.

## Evidence
- Playwright reproduced the production failure on Course import job 7.
- The job has three approved outline Lessons, all owned by source chunk `0`; only one Lesson
  content draft persisted before `LESSON_GENERATION_FAILED`.
- Retrying through the production Admin UI returned HTTP 500 with the generic
  `AI_PROVIDER_ERROR` and left the job safely retryable with one of three Lessons complete.
- The Lesson parser did not have the deterministic single-chunk citation normalization already
  used by the Course-outline parser.

## Scope
- Canonicalize non-empty integer Lesson-section citations to the sole server-owned chunk when
  exactly one chunk is supplied.
- Preserve strict rejection of non-integer citations and out-of-range or duplicate citations when
  multiple chunks are supplied.
- Tell the provider the exact citation required for a one-chunk Lesson request.
- Add regression tests, run all gates, review, commit, push, deploy, and verify production.

## Acceptance Criteria
- [x] One-chunk Lesson responses using 1-based or duplicate integer citations resolve to the sole
  server-owned chunk index.
- [x] Multi-chunk Lesson responses still reject out-of-range citations.
- [x] No source text, output, filename, credential, or token is logged.
- [x] Required quality gates and review pass.
- [ ] The fix is deployed and the failed production batch completes.

## Required Commands
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- `git diff --check`
