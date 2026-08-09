# Active Task Queue

- **Active task:** `TASK-040` — Performance and Release Readiness
- **Status:** `VERIFIED`
- **Owner:** Codex
- **Previous task:** `TASK-043` — Document-to-Lesson Content Pipeline (`VERIFIED`)

## Current objective

Package measured performance evidence and an executable release-readiness runbook
without pushing, deploying, or applying migrations to an external database.

## Delivery order

1. Measure representative route baselines in a controlled local production build.
2. Audit bundle/client boundaries, waterfalls, pagination and obvious N+1 behavior.
3. Reconcile CI, environment, migration, rollback and smoke-test documentation.
4. Run all required quality gates and review the actual TASK-040 diff.

## Current state

Implementation, required quality gates and review are complete with verdict `PASS`.
TASK-040 is `VERIFIED`; existing unrelated working-tree changes remain preserved and
excluded from the TASK-040 commit.
