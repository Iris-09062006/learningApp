# Active Task Queue

- **Active task:** `TASK-049` — Bootstrap Empty Content Curriculum
- **Status:** `IN_PROGRESS`
- **Owner / Reviewer:** Codex
- **Deferred design task:** `TASK-047` (`DRAFT`)
- **Previous blocked task:** `TASK-044` — external Supabase Redirect URL verification

## Current objective

Reduce page-navigation latency, stabilize the Document-to-Lesson AI request/loading flow, and allow an Admin to create a new unpublished target lesson in an existing chapter. Record the Stitch-led redesign without implementing it before designs are supplied.

## Current state

Supabase Development currently has zero courses, chapters, and lessons, leaving the
Document-to-Lesson target selector empty. TASK-049 adds the smallest Admin-controlled
bootstrap path for an unpublished course and first chapter. Production remains
unchanged; TASK-047 remains deferred until Stitch designs arrive. Existing user
changes in `AGENTS.md`, `docs/decisions.md`, and untracked probe files remain outside
scope.
