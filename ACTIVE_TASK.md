# Active Task Queue

- **Active task:** `TASK-051` — Publish Verified Release to GitHub and Vercel Production
- **Status:** `FIXED_FOR_REVIEW` — CI clean-install fix passed all local gates
- **Owner / Reviewer:** Codex
- **Deferred design task:** `TASK-047` (`DRAFT`)
- **Previous blocked task:** `TASK-044` — external Supabase Redirect URL verification

## Current objective

Publish the verified TASK-050 release lineage to GitHub `main`, deploy the exact
published commit to Vercel Production, and verify the production deployment.

## Current state

TASK-050 is verified on Supabase Development and Vercel Preview. TASK-051 is the
explicitly authorized production release. New mode creates a
new course plus a source-named chapter/lesson; existing mode appends a source-named
chapter/lesson to the selected course. The user-created `phương pháp tính / Nội suy
lagrange` records remain unchanged. Production remains unchanged; TASK-047 remains
deferred until Stitch designs arrive. Existing user changes in `AGENTS.md`,
`docs/decisions.md`, and untracked probe files remain outside scope.

The first production deployment is `READY`, but its health endpoint reports the
database unavailable. GitHub Actions run `31361233448` failed before tests because
the lockfile omitted overridden optional dependencies. The lockfile/runtime fix has
passed `npm ci` and every local gate and is awaiting remote CI verification.
