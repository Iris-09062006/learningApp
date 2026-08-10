# Active Task Queue

- **Active task:** `TASK-048` — Deploy Navigation and AI Pipeline Hotfix to Current Preview
- **Status:** `IN_PROGRESS`
- **Owner / Reviewer:** Codex
- **Deferred design task:** `TASK-047` (`DRAFT`)
- **Previous blocked task:** `TASK-044` — external Supabase Redirect URL verification

## Current objective

Reduce page-navigation latency, stabilize the Document-to-Lesson AI request/loading flow, and allow an Admin to create a new unpublished target lesson in an existing chapter. Record the Stitch-led redesign without implementing it before designs are supplied.

## Current state

TASK-045/TASK-046 implementation and review pass. Deployment authorization is now explicit for the existing Vercel Preview and Supabase Development project. Production remains out of scope. Existing user changes in `AGENTS.md`, `docs/decisions.md`, and untracked probe files remain outside scope.
