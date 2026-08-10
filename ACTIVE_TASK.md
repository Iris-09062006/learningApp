# Active Task Queue

- **Active task:** None; `TASK-048` is verified
- **Status:** `VERIFIED`
- **Owner / Reviewer:** Codex
- **Deferred design task:** `TASK-047` (`DRAFT`)
- **Previous blocked task:** `TASK-044` — external Supabase Redirect URL verification

## Current objective

Reduce page-navigation latency, stabilize the Document-to-Lesson AI request/loading flow, and allow an Admin to create a new unpublished target lesson in an existing chapter. Record the Stitch-led redesign without implementing it before designs are supplied.

## Current state

TASK-045/TASK-046 are deployed to Vercel Preview and Supabase Development through
TASK-048. Production remains unchanged. TASK-047 remains deferred until the user
provides Stitch designs. Existing user changes in `AGENTS.md`, `docs/decisions.md`,
and untracked probe files remain outside scope.
