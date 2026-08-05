# LearningApp Roadmap

## Current State

- **Current phase:** Phase 4 — Learning Execution (Lessons, Exercises, and Progress Engine)
- **Completed:** project foundation, testing/CI setup, Supabase core database verification, authentication service/API & UI, course catalog & detail, course enrollment API & UI, visual learning roadmap page.
- **In progress:** `TASK-025` — Lesson Content API and Viewer (Packet created, ready to implement).
- **Queued next:** `TASK-026` — Exercise API, Evaluation, and Submissions.
- **Queued after exercises:** `TASK-027` — Progress Tracking API and Learner Progress Engine.
- **Source of truth:** `project/TASKS.md`, task packets in `tasks/`, and implementation/review reports in `reports/`.

## Phase Overview

| Phase | Scope | Status |
|---|---|---|
| Phase 0 | Documentation and agent workflow | DONE |
| Phase 1 | Project foundation and quality gates | DONE |
| Phase 2 | Supabase database and security foundation | DONE |
| Phase 3 | Authentication and learning core | DONE |
| Phase 4 | Lessons, exercises, submissions, and progress | DONE |
| Phase 5 | AI explanations and mentor experience | DONE |
| Phase 6 | Dashboards and administration | IN_PROGRESS |
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
- `TASK-023` — Course enrollment feature and API integration — **VERIFIED**
- `TASK-024` — Visual learning roadmap page — **VERIFIED**

## Phase 4 — Learning Execution

- `TASK-025` — Lesson Content API and Viewer — **VERIFIED**
- `TASK-026` — Exercise API, Evaluation, and Submissions — **VERIFIED**
- `TASK-027` — Progress Tracking API and Learner Progress Engine — **VERIFIED**

## Phase 5 — AI Mentor

- `TASK-028` — AI Mentor API and Explanation Service — **VERIFIED**
- `TASK-029` — AI Learning Recommendation Experience — **VERIFIED**
- `TASK-030` — AI Exercise Generation Backend — **VERIFIED**

## Phase 6 — Operations and Dashboards

- `TASK-031` — Content Moderation API and Moderation Queue — **VERIFIED**
- `TASK-032` — Learner Dashboard and Profile Management — **VERIFIED**
- `TASK-033` — User Administration and System Health Dashboard — **READY**

## Phase 7 — Hardening and Deployment

Security regression, accessibility/performance review, and deployment remain planned. Production deployment requires an explicit user request.
