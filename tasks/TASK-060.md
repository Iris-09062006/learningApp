# TASK-060 — Fix Course Publish Markdown JSON Precedence

## Status
`VERIFIED`

## Owner / Reviewer
Codex / Codex

## Objective
Repair hosted Course publication failing with PostgreSQL `22P02` when Lesson Markdown begins
with `#`, then verify job #5 publishes atomically and becomes visible to learners.

## Scope
- Correct JSON extraction precedence in `publish_course_import_job`.
- Add and apply a forward-only migration through Supabase MCP.
- Add regression coverage and verify the published Course and six Lessons.
- Preserve unrelated working-tree changes.

## Acceptance Criteria
- [x] Markdown headings are concatenated as text without JSON parsing.
- [x] Hosted migration applies successfully.
- [x] Course import job #5 is published exactly once with six published Lessons.
- [x] Published Course is available to the learner catalog query.
- [x] Focused/full required quality gates pass and review has no open findings.

## Required Commands
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- `git diff --check`
