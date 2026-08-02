# LearningApp Roadmap

## Current State

- **Current phase:** Phase 3 — Authentication & Learning Core
- **Completed:** project foundation, testing/CI setup, Supabase core database verification, authentication service/API, authentication pages, course catalog and course detail.
- **Next task:** `TASK-023` — Course Enrollment Feature & API Integration.
- **Queued after enrollment:** `TASK-024` — Visual Learning Roadmap.
- **Source of truth:** `project/TASKS.md`, task packets in `tasks/`, and implementation/review reports in `reports/`.

## Phase Overview

| Phase | Scope | Status |
|---|---|---|
| Phase 0 | Documentation and agent workflow | DONE |
| Phase 1 | Project foundation and quality gates | DONE |
| Phase 2 | Supabase database and security foundation | DONE |
| Phase 3 | Authentication and learning core | IN_PROGRESS |
| Phase 4 | Lessons, exercises, submissions, and progress | PLANNED |
| Phase 5 | AI explanations and mentor experience | PLANNED |
| Phase 6 | Dashboards and administration | PLANNED |
| Phase 7 | Security hardening, regression testing, and deployment | PLANNED |

## Phase 1 — Project Foundation and Quality Gates

- `TASK-001` — Bootstrap Next.js and project configuration — **DONE**
- `TASK-002` — Configure Vitest and Playwright — **DONE**
- `TASK-003` — Primitive UI components foundation — **DONE**
- `TASK-004` — CI quality-gates workflow — **DONE**
- `TASK-010A` — Repair project baseline — **VERIFIED**

## Phase 2 — Supabase Database Foundation

- `TASK-015` — Apply and verify Supabase core database — **VERIFIED**

> The former `TASK-010`–`TASK-014` packets were overlapping database work and have been retired. Their implemented scope is represented by `TASK-015` and the current migrations/types.

## Phase 3 — Authentication and Learning Core

- `TASK-020` — Authentication service and API handlers — **VERIFIED**
- `TASK-021` — Auth pages UI — **VERIFIED**
- `TASK-022` — Course catalog and course detail — **VERIFIED**
- `TASK-023` — Course enrollment feature and API integration — **READY**
- `TASK-024` — Visual learning roadmap page — **READY**

## Phase 4 — Learning Execution

Planned work includes lesson content viewing, exercise rendering/evaluation, submission and grading, and progress/unlock logic. Detailed task packets will be created only when the preceding contracts are verified.

## Phase 5–7

AI integration, dashboards/administration, security regression, accessibility/performance review, and production deployment remain planned. No task is considered active until a corresponding packet is created and added to `project/TASKS.md`.