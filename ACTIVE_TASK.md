# Active Task Queue

- **Active task:** None
- **Status:** `READY`
- **Owner / Reviewer:** Codex
- **Deferred design task:** `TASK-047` (`DRAFT`)
- **Previous blocked task:** `TASK-044` — external Supabase Redirect URL verification

## Current objective

No task is currently active. TASK-057 is verified locally and ready for migration rollout
when explicitly requested.

## Current state

TASK-057 is verified locally. The Admin PDF-to-Course flow now persists an outline review
checkpoint, generates/revises Lesson content independently, and publishes official
curriculum atomically. Migration `025` is intentionally not applied to shared Supabase,
and no deployment was performed.

TASK-055 is verified locally. PDF-to-Course batch generation, persistent review
resolution, per-Lesson exercise generation, authorization hardening, focused/full
unit tests, E2E, lint, typecheck, build, and diff review pass. Migration `023` is
intentionally not applied to shared Supabase, and no deployment was performed.
