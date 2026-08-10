# TASK-057 — Two-stage PDF-to-Course Pipeline

## Status
`VERIFIED`

## Owner / Reviewer
Codex / Codex

## Objective
Implement Pipeline A from the current product contract: private PDF upload and extraction,
outline-only AI generation, persisted Admin outline review/edit, per-Lesson content
generation and revision, Course review, and atomic publication of official Course/Chapter/
Lessons. The pipeline must never create Exercises.

## Dependencies
- `TASK-055` — existing one-stage Course batch and Lesson-scoped Exercise boundary (`VERIFIED`)
- `TASK-054` — persistent review/publish repair (`VERIFIED`)
- Documentation commit `cc4e065`

## Required Context
- `AGENTS.md`, `CODEX.md`, `ACTIVE_TASK.md`
- `docs/requirements.md`, `docs/architecture.md`, `docs/database.md`
- `docs/api_contract.md`, `docs/security.md`, `docs/ui.md`, `docs/features.md`
- `docs/document-to-lesson.md`

## Final State
- Migration `025` provides normalized import/outline/content revisions and atomic publish.
- The Admin default flow is outline-first, then per-Lesson generation/review; historical
  one-stage routes remain compatibility-only.
- Exercise generation remains Lesson-scoped, separately moderated, and outside Course import.

## In Scope
- Forward-only migration for normalized Course-import jobs, outline revisions/Lessons,
  per-Lesson content drafts/citations, review history, publication mapping, RLS and RPCs.
- Strict outline provider schema/prompt with no full Lesson content or Exercise fields.
- Persisted outline edit/add/remove/reorder/regenerate and Continue transition.
- Generate/regenerate Lesson content independently from approved outline context.
- Atomic, idempotent Course/Chapter/Lesson publish with persistent queue resolution.
- Admin API/UI for the complete state machine and regression tests/E2E mocks.
- Shared AI rate-limit scopes and HTTP 429 mapping for Course generation plus regression
  enforcement that the separate Lesson-scoped Exercise endpoint remains capacity-limited.
- Generated database types and task/reports/documentation implementation notes.

## Out of Scope
- Exercise generation/moderation changes except regression protection of the boundary.
- OCR, multi-document RAG, deployment, applying migration to shared Supabase, push.
- Rewriting migrations `001`–`024` or deleting compatibility data/routes.

## Files Allowed to Change
- `src/app/api/admin/**`
- `src/app/api/ai/exercises/generate/**`
- `src/features/ai/services/**`
- `src/features/content-pipeline/**`
- `src/generated/database.types.ts`
- `src/lib/rate-limiter.ts`
- `supabase/migrations/025_pdf_to_course_pipeline.sql`
- `tests/e2e/**`
- `docs/**` only for implementation-state corrections
- `tasks/TASK-057.md`, `reports/TASK-057-*.md`, `ACTIVE_TASK.md`, `project/TASKS.md`

## Acceptance Criteria
- [x] Upload/extract creates no official curriculum or Exercise.
- [x] AI outline is strict, contains Course/Lesson structure only, and is persisted.
- [x] Admin can edit Course metadata and add/remove/reorder/regenerate outline Lessons.
- [x] Continue locks an approved outline revision before Lesson generation.
- [x] Lesson content can be generated/retried/regenerated independently with citations.
- [x] Course review publishes official Course/Chapter/Lessons atomically and idempotently.
- [x] Published/rejected items remain absent from pending queue after reload.
- [x] Unauthorized, invalid AI output, timeout, invalid transitions and publish rollback are covered.
- [x] Course pipeline cannot insert `generated_exercises` or `exercises`.
- [x] Required quality gates pass and review has no open Critical/High/Medium finding.

## Required Commands
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run test:e2e`
- `npm run build`
- `git diff --check`

## Expected Handoff
- Implementation/test/review reports, exact files and command results, commit hash, and
  migration/deployment limitation.
