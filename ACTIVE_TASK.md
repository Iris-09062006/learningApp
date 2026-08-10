# Active Task Queue

- **Latest tasks:** `TASK-045`, `TASK-046`
- **Status:** `VERIFIED`
- **Owner / Reviewer:** Codex
- **Deferred design task:** `TASK-047` (`DRAFT`)
- **Previous blocked task:** `TASK-044` — external Supabase Redirect URL verification

## Current objective

Reduce page-navigation latency, stabilize the Document-to-Lesson AI request/loading flow, and allow an Admin to create a new unpublished target lesson in an existing chapter. Record the Stitch-led redesign without implementing it before designs are supplied.

## Current state

Implementation and review pass. Lint, typecheck, 423 tests, production build, and diff checks pass. Migration `018_create_lesson_content_target.sql` is committed locally but intentionally not applied to Supabase Cloud because deployment was not requested. Existing user changes in `AGENTS.md`, `docs/decisions.md`, and untracked probe files remain outside scope.
