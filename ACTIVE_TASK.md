# Active Task Queue

- **Active task:** `TASK-043` — Document-to-Lesson Content Pipeline
- **Status:** `VERIFIED`
- **Owner:** Codex
- **Deferred task:** `TASK-040` — Performance and Release Readiness (`PLANNED`, paused by product priority)

## Current objective

Build the document-to-lesson epic: private source upload, deterministic extraction,
9Router-backed structured lesson drafts with citations, Admin review/editing, and
transactional publication before a course becomes visible in the catalog.

## Delivery order

1. Align PRD and technical contracts.
2. Add Storage, source-document, draft, citation, review and publish schema.
3. Reconcile and deploy migrations to Supabase Cloud through Supabase MCP.
4. Build upload/extraction and structured generation pipeline.
5. Build Admin review/edit experience.
6. Publish approved content transactionally and verify catalog isolation.

## Current state

Supabase MCP connectivity recovered. Migrations `010` through `015` and the Cloud
hardening migration are applied, Cloud types are regenerated, advisor findings are
resolved or documented, and every required quality gate passes.
