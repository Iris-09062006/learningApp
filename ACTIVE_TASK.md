# Active Task Queue

- **Active task:** None
- **Status:** `VERIFIED` — `TASK-051` published and production-verified
- **Owner / Reviewer:** Codex
- **Deferred design task:** `TASK-047` (`DRAFT`)
- **Previous blocked task:** `TASK-044` — external Supabase Redirect URL verification

## Current objective

Wait for the user-provided Stitch designs before implementing `TASK-047`.

## Current state

TASK-051 is verified on GitHub and Vercel Production. GitHub Actions quality gates
and deterministic Chromium E2E pass. Production health is `ok` with the database
connected, and login rate limiting no longer fails closed because the Vercel
service-role credential was corrected. New mode creates a
new course plus a source-named chapter/lesson; existing mode appends a source-named
chapter/lesson to the selected course. The user-created `phương pháp tính / Nội suy
lagrange` records remain unchanged. TASK-047 remains deferred until Stitch designs
arrive. Existing user changes in `AGENTS.md`,
`docs/decisions.md`, and untracked probe files remain outside scope.
