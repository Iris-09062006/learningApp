# TASK-057 Implementation Report

## Outcome

The Admin PDF-to-Course path now runs as a persisted two-stage workflow: upload/extract,
outline-only AI generation and Admin editing, explicit Continue, independent Lesson content
generation/revision, Course review, then atomic publication of official curriculum. Course
import does not create Exercises; the separate Lesson-scoped Exercise flow remains intact.

## Implementation

- Added migration `025` with normalized import jobs, outline revisions, ordered Lesson
  outlines, cited Lesson content revisions, review records, publication mappings, Admin-only
  RLS, and state-changing RPCs.
- Added strict provider schemas and server validation for outline-only and per-Lesson output,
  with source-chunk provenance and explicit rejection of Exercise-like outline fields.
- Added Admin APIs and UI for outline edit/add/remove/reorder/regenerate, Continue, per-Lesson
  edit/regenerate, retry, reject/needs-revision, and atomic publish.
- Added distributed AI capacity scopes and consistent HTTP 429 handling.
- Updated generated database types, implementation-state contracts, unit/integration tests,
  migration invariants, UI coverage, and the critical-flow E2E mock.

## Deployment

Migration `025` was not applied to a shared or production Supabase project. No push or
deployment was performed. Pre-existing changes in `AGENTS.md`, `docs/decisions.md`, and
untracked probe files were preserved outside this task.
