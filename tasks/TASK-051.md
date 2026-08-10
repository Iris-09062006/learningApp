# TASK-051 — Publish Verified Release to GitHub and Vercel Production

## Status
`FIXED_FOR_REVIEW`

## Objective
Publish the latest verified LearningApp release commit to GitHub `main`, deploy it
to the linked Vercel Production project, and verify the production deployment.

## Scope
- Preserve unrelated local working-tree changes.
- Run the default local quality gates against the release source.
- Repair the GitHub Actions clean-install failure caused by a stale lockfile and
  align CI with the supported Node.js runtime.
- Review the release diff and scan staged release metadata for secrets.
- Fast-forward GitHub `main` to the verified release lineage.
- Deploy the exact published commit to Vercel Production.
- Verify deployment readiness, public health, and runtime errors.
- Record release evidence and final status.

## Out of Scope
- Supabase Production schema changes or dashboard configuration changes.
- Existing uncommitted changes in `AGENTS.md`, `docs/decisions.md`, and probe files.
- TASK-047 UI redesign.

## Acceptance Criteria
- `lint`, `typecheck`, `test`, and `build` pass.
- `npm ci` succeeds from the committed manifest and lockfile, and GitHub Actions
  quality-gates plus deterministic Chromium E2E pass.
- Review has no open Critical, High, or Medium findings.
- GitHub `main` points to the recorded release commit.
- Vercel Production deployment reaches `READY` and its smoke checks pass.
- Deployment logs contain no unresolved release-related errors.
