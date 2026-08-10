# TASK-055 — Generate Reviewable Courses and Lesson-scoped Exercises

## Status
`VERIFIED`

## Owner / Reviewer
Codex / Codex

## Objective
Replace the one-document/one-lesson creation path with an Admin workflow that
turns one extracted PDF into one unpublished Course containing multiple cited
Lesson drafts, reviews and publishes that Course batch atomically, and exposes
exercise generation only as a separate action scoped to one selected Lesson.

## Dependencies
- `TASK-030` — AI Exercise Generation Backend (`VERIFIED`)
- `TASK-031` — Content Moderation (`VERIFIED`)
- `TASK-043` — Document-to-Lesson Content Pipeline (`VERIFIED`)
- `TASK-054` — Lesson Review and Publish Repair (`VERIFIED`)

## Required Context
- `AGENTS.md`
- `CODEX.md`
- `.ua/knowledge-graph.json` rebuilt from current HEAD
- `docs/requirements.md`
- `docs/architecture.md`
- `docs/database.md`
- `docs/api_contract.md`
- `docs/security.md`
- `docs/coding_standards.md`
- `docs/ui.md`
- `docs/features.md`
- `docs/document-to-lesson.md`

## Current State
- PDF generation accepts a pre-created target Lesson and requests exactly one
  Lesson draft from the provider.
- Course creation inserts one placeholder Chapter and Lesson before generation.
- The lesson-draft queue loads every status, so approved, rejected, and published
  items remain in the pending review experience.
- The exercise backend already reads one Lesson context and stores
  `generated_exercises.lesson_id`, but Admin content UI has no per-Lesson trigger.

## In Scope
- Generate one structured Course draft and multiple cited Lesson drafts from one
  extracted PDF; the Course-generation schema and prompt must contain no exercise.
- Persist the unpublished Course, Chapter, Lessons, Lesson drafts, and citations
  atomically and group review state by source document.
- Allow Admin to inspect Course metadata, Lesson order/content, edit Lesson drafts,
  approve+publish the full batch atomically, or reject it persistently.
- Return only pending/revision Course batches in the default review queue so a
  resolved item stays gone after refresh without deleting its records.
- Add an explicit per-Lesson exercise generation panel that calls the existing
  server-side exercise generation flow and preserves `lesson_id` ownership.
- Update generated database types, documentation, focused tests, and E2E mocks.

## Out of Scope
- Batch-generating exercises for a Course or during PDF generation.
- Automatically publishing generated exercises; existing exercise moderation
  remains required.
- OCR, multi-document RAG, arbitrary curriculum CRUD, migration deployment, push,
  or production deployment.
- Deleting or rewriting historical source documents, drafts, or user changes.

## Files Allowed to Change
- `src/app/api/admin/**`
- `src/app/api/ai/exercises/generate/**`
- `src/features/content-pipeline/**`
- `src/features/ai/**`
- `src/generated/database.types.ts`
- `supabase/migrations/023_course_draft_batches.sql`
- `tests/e2e/**`
- `docs/requirements.md`
- `docs/architecture.md`
- `docs/database.md`
- `docs/api_contract.md`
- `docs/security.md`
- `docs/ui.md`
- `docs/features.md`
- `docs/document-to-lesson.md`
- `tasks/TASK-055.md`
- `reports/TASK-055-*.md`
- `ACTIVE_TASK.md`
- `project/TASKS.md`

## Files Not Allowed to Change
- Existing migrations `001`–`022`
- Existing user-owned changes outside the allowed files
- Secrets, environment files, deployment configuration

## Acceptance Criteria
- [x] One PDF produces one Course draft with 2–20 ordered Lesson drafts.
- [x] Course generation produces no exercise payload or exercise row.
- [x] Course, Chapter, Lessons, drafts, and citations are persisted atomically.
- [x] Pending review displays Course metadata, Lesson list, and Lesson content.
- [x] Approve publishes the whole Course/Lesson batch in one transaction.
- [x] Reject persists the decision without publishing curriculum.
- [x] Approved/rejected batches disappear from pending review immediately and
      remain absent after reload while their database history remains.
- [x] Exercise generation is initiated for exactly one Lesson, uses that Lesson's
      current title/content, and stores the resulting `lesson_id`.
- [x] Exercise generation remains role-protected and enters the existing separate
      moderation flow instead of auto-publishing.
- [x] Validation, provider failure, empty/loading/success/error states, and
      authorization have regression coverage.
- [x] Required quality gates pass and review has no open Critical/High/Medium finding.

## Required Commands
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run test:e2e`
- `npm run build`
- `git diff --check`

## Expected Handoff
- Implementation, test, and review reports
- Exact files changed and commands/results
- Commit hash
- Remaining limitations and deployment note
