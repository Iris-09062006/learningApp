# Active Task Queue

- **Active task:** `TASK-050` — Separate New Course and Existing Lesson Upload Flows
- **Status:** `IN_PROGRESS`
- **Owner / Reviewer:** Codex
- **Deferred design task:** `TASK-047` (`DRAFT`)
- **Previous blocked task:** `TASK-044` — external Supabase Redirect URL verification

## Current objective

Separate the new-course upload flow from the existing-lesson flow exactly as the
user specified.

## Current state

Supabase Development contains the user-created unpublished course `phương pháp tính`
and chapter `Nội suy lagrange`, but no lesson. TASK-050 replaces the mixed TASK-049
controls with two independent submission paths and preserves these records.
Production remains unchanged; TASK-047 remains deferred until Stitch designs arrive.
Existing user changes in `AGENTS.md`, `docs/decisions.md`, and untracked probe files
remain outside scope.
