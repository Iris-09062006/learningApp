# Active Task Queue

- **Active task:** None
- **Status:** `VERIFIED` — `TASK-049` completed
- **Owner / Reviewer:** Codex
- **Deferred design task:** `TASK-047` (`DRAFT`)
- **Previous blocked task:** `TASK-044` — external Supabase Redirect URL verification

## Current objective

Wait for the user-provided Stitch designs before implementing `TASK-047`.

## Current state

TASK-049 is verified on Supabase Development and Vercel Preview. When curriculum is
empty, an active Admin can create an unpublished course and first chapter inline;
the new chapter is selected automatically so upload can continue. Production remains
unchanged; TASK-047 remains deferred until Stitch designs arrive. Existing user
changes in `AGENTS.md`, `docs/decisions.md`, and untracked probe files remain outside
scope.
