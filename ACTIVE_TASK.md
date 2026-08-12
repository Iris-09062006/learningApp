# Active Task Queue

- **Active task:** `TASK-065` — Retry Invalid Course Outline Generation
- **Status:** `IN_PROGRESS`
- **Owner / Reviewer:** Codex
- **Deferred design task:** `TASK-047` (`DRAFT`)
- **Previous blocked task:** `TASK-044` — external Supabase Redirect URL verification

## Current objective

Retry an invalid first Course-outline response once with explicit business constraints, preserving
strict server validation, generic client errors, source-reference ownership, and safe diagnostics.
Production sources 25 and 26 reproduced the failure after the first deploy; the current fix
canonicalizes provider citation numbering only when the server has exactly one possible chunk.

## Previous verified objective

TASK-064 is verified in production. Sources 23 and 24 each persisted 2,392 extracted characters,
confirming the Vercel Node 22/native Linux PDF packaging fix before the separate outline failure.

TASK-063 is verified. Learners can use “Tiếp theo” to start the immediately following published
Lesson without waiting for completion, while exercise-based completion remains truthful. Migration
029 is applied and verified on hosted Supabase as version `20260811153651`.

## Previous verified work

TASK-061 is verified locally and on hosted Supabase. `POST /api/lessons/:lessonId/start` now writes
through a hardened, authenticated `start_lesson` RPC instead of a forbidden direct
`user_progress` upsert. Hosted migration `20260811133320` is applied; transactional smoke testing
passed and rolled back without changing learner progress.

TASK-060 is verified. Hosted migration `20260811102054` fixes Markdown/JSON operator
precedence; Course import job #5 published Course 17 and six visible Lessons atomically.

TASK-059 is verified. Provider schemas now use the Gemini-compatible structural subset while
strict server-side validation continues to enforce every business constraint.

TASK-058 is verified locally. The Lesson-specific flow now generates strict pending Exercise
drafts, preserves immutable atomic review history, and publishes approved drafts idempotently.
Migrations `024`, `025`, and `026` were applied through Supabase MCP to project
`yzucdzlgaucmduoghjft` on 2026-08-10 and verified against the remote catalog.

## Current state

TASK-057 is verified locally. The Admin PDF-to-Course flow now persists an outline review
checkpoint, generates/revises Lesson content independently, and publishes official
curriculum atomically. Migration `025` is intentionally not applied to shared Supabase,
and no deployment was performed.

TASK-055 is verified locally. PDF-to-Course batch generation, persistent review
resolution, per-Lesson exercise generation, authorization hardening, focused/full
unit tests, E2E, lint, typecheck, build, and diff review pass. Migration `023` is
intentionally not applied to shared Supabase, and no deployment was performed.
