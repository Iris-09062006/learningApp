# TASK-058 — Lesson-to-Exercise Pipeline

## Status
`VERIFIED`

## Owner / Reviewer
Codex / Codex

## Objective
Implement Pipeline B as an independent Published Lesson → Exercise draft → review/edit →
approve → atomic publish workflow. Every generated and published Exercise must remain owned
by exactly one Lesson and the flow must not read or mutate Course-import state.

## Dependencies
- `TASK-057` — two-stage PDF-to-Course pipeline (`VERIFIED`)
- `TASK-031` — historical moderation queue (`VERIFIED`)
- `TASK-030` — historical AI Exercise generation backend (`VERIFIED`)

## Current State / Investigation
- Generation already accepts one `lessonId`, rate-limits active Moderator/Admin, and writes a
  pending `generated_exercises.lesson_id`.
- The UI entry is incorrectly embedded in `/admin/content` instead of a Lesson-specific flow.
- Context omits objectives/course metadata and does not enforce the full published ancestry.
- Stored AI JSON (`options: string[]`, `correctAnswer`) does not match the old publish RPC
  (`options` objects, `solution`), so publication is not reliable.
- Review edits are discarded by the route and review/update writes are not transactional.
- Direct table mutation policies can bypass review states; publish lacks empty `search_path`,
  row locking and idempotent retry.

## In Scope
- Forward migration `026` for authorized context, pending-draft persistence, atomic review/edit,
  hardened permissions, and atomic/idempotent publish with correct option/solution mapping.
- One strict Exercise draft schema shared across provider, service, moderation and publish.
- Published Lesson context with objectives and optional Course metadata; provider timeout.
- Lesson-specific Moderator/Admin UI and removal of generation controls from Course import UI.
- Review history, structured editing, approved-only publish UX, routes and regression tests.
- Generated types, docs implementation notes, task state and reports.

## Out of Scope
- Course/PDF exercise generation, learner-authored exercises, free-form code execution, OCR,
  batch generation across Lessons, deployment, applying migration to shared Supabase, push.
- Rewriting migrations `001`–`025` or changing Course-import state.

## Files Allowed to Change
- `src/app/(main)/moderation/**`
- `src/app/api/ai/exercises/**`
- `src/app/api/moderation/**`
- `src/features/ai/**`
- `src/features/content-pipeline/components/**` only to remove the embedded Exercise form
- `src/features/moderation/**`
- `src/generated/database.types.ts`
- `supabase/migrations/026_lesson_to_exercise_pipeline.sql`
- `tests/e2e/**`
- `docs/**` only for TASK-058 implementation-state corrections
- `tasks/TASK-058.md`, `reports/TASK-058-*.md`, `ACTIVE_TASK.md`, `project/TASKS.md`

## Acceptance Criteria
- [x] Generation starts from one specific published Lesson and uses its content as primary context.
- [x] Objectives and optional Course metadata are server-derived; no PDF/source chunks are sent.
- [x] Strict invalid/unknown AI output and provider timeout fail without persisting a draft.
- [x] Pending draft persists the selected `lesson_id` and is invisible to learners.
- [x] Review edits are strictly validated and atomically persisted with immutable review history.
- [x] Only approved valid drafts publish; retry is idempotent and partial writes rollback.
- [x] Published options and server-only solution use real option IDs and grade correctly.
- [x] Direct client mutation cannot bypass draft/review/publish states.
- [x] Pipeline B does not read or mutate Course-import job/draft state.
- [x] Required gates pass and review has no open Critical/High/Medium finding.

## Required Commands
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run test:e2e`
- `npm run build`
- `git diff --check`

## Expected Handoff
Implementation/test/review reports, exact command evidence, commit hash, and migration rollout
limitation.
