# TASK-043 — Document-to-Lesson Content Pipeline

## Status
`VERIFIED`

## Phase
Content Operations Epic

## Objective
Allow an Admin to upload a trusted source document, extract bounded text, ask an
OpenAI-compatible 9Router endpoint for a structured lesson draft with verifiable
citations, review and edit that draft, and publish the resulting course content
atomically before it can appear in the public catalog.

## Dependencies
- Existing course, lesson, AI provider and moderation modules.
- Supabase Auth, PostgreSQL, Storage and RLS.
- A server-reachable 9Router OpenAI-compatible endpoint in non-test environments.

## Required Context
- `AGENTS.md`, `CODEX.md`, `ACTIVE_TASK.md`
- `docs/requirements.md`, `docs/document-to-lesson.md`
- `docs/architecture.md`, `docs/database.md`, `docs/api_contract.md`
- `docs/security.md`, `docs/ui.md`, `docs/decisions.md`
- `.ua/knowledge-graph.json`
- `supabase/migrations/*`

## In Scope
- Private `lesson-sources` Storage bucket with Admin-only object policies.
- Source document metadata, extracted chunks, lesson drafts, draft citations and
  review history with RLS.
- Upload and server-side extraction for the MIME types documented in the PRD.
- Structured JSON generation through the existing AI provider boundary, configured
  for 9Router with timeout, response validation and citation integrity checks.
- Admin queue/detail UI for upload, generation, review, editing and publication.
- A transaction/RPC that publishes an approved draft into a lesson and exposes its
  course only when all publish invariants pass.
- Focused tests, full quality gates, Supabase MCP verification and reports.

## Out of Scope
- Vector search or cross-document RAG.
- Browser-side AI calls or exposure of source objects to learners.
- OCR for scanned images/PDFs.
- Autonomous publication without Admin approval.
- Push or application deployment.

## Acceptance Criteria
- Only active Admins can upload, read, extract, generate, review or publish source
  documents and lesson drafts.
- Storage is private; accepted MIME types and size are enforced by both API and bucket.
- Extracted chunks have stable indexes and citations resolve to the exact source chunk.
- AI output is strict structured data and is rejected when citations are absent,
  duplicated, out of range or reference a different document.
- Admin can edit a draft, record a review decision and see clear loading/error/status
  feedback with keyboard-accessible labelled controls.
- Publish is idempotent and transactional; partial lesson/course publication cannot
  occur, and unapproved content never reaches the public catalog.
- Cloud migration state, table/RLS state and security/performance advisors are checked
  through Supabase MCP.
- `lint`, `typecheck`, `test`, `build` and `git diff --check` pass.

## Required Commands
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- `git diff --check`

## Review focus
- Prompt injection isolation and server-only provider credentials.
- Storage path ownership and RLS authorization.
- Citation provenance and draft schema validation.
- Transaction locking/idempotency and catalog visibility.
- Preservation of unrelated working-tree changes.

## Cloud recovery evidence (2026-08-09)

- Supabase MCP `list_projects` and `get_project` succeed for project
  `yzucdzlgaucmduoghjft` (`learningApp`, `ACTIVE_HEALTHY`).
- Database MCP calls recovered and migrations `010` through `015` were applied in
  order without schema drift.
- Cloud RLS, grants, Storage policy and function ACL checks passed for the new pipeline.
- Migration `016_harden_cloud_permissions_and_indexes.sql` removed legacy anonymous
  function grants, optimized auth policy initialization and covered every foreign key
  reported by the performance advisor.
- Cloud-generated TypeScript types were refreshed; lint, typecheck, 396 tests, build and
  `git diff --check` pass.
