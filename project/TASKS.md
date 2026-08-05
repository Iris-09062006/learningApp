# LearningApp Task Registry

## Status Legend

- `DONE`: Historical task completed and committed.
- `VERIFIED`: Implementation, required tests, and review evidence pass.
- `READY`: Packet is defined and ready to implement.
- `IN_PROGRESS`: Currently being implemented.
- `PLANNED`: Future work without an active packet.

## Active Task

Task đang triển khai: Không có. Các task tiếp theo của Phase 5 và Phase 6 đã có packet ở trạng thái `READY`.

## Verified and Completed Tasks

| Task ID | Title | Status | Phase | Evidence |
|---|---|---|---|---|
| `TASK-028` | AI Mentor API and Explanation Service | VERIFIED | Phase 5 | `reports/TASK-028-implementation.md`, `reports/TASK-028-review.md`, `reports/TASK-028-test.md` |
| `TASK-030` | AI Exercise Generation Backend | VERIFIED | Phase 5 | `reports/TASK-030-implementation.md`, `reports/TASK-030-review.md` |
| `TASK-029` | AI Learning Recommendation Experience | VERIFIED | Phase 5 | `reports/TASK-029-implementation.md`, `reports/TASK-029-review.md`, `reports/TASK-029-test.md` |
| `TASK-000` | Documentation and Agent Workflow | DONE | Phase 0 | Repository workflow documentation (`AGENTS.md`, `CODEX.md`) |
| `TASK-001` | Bootstrap Next.js and Project Configuration | DONE | Phase 1 | Git commit history & baseline configs |
| `TASK-002` | Configure Vitest and Playwright | DONE | Phase 1 | `reports/TASK-002-implementation.md`, `reports/TASK-002-review.md` |
| `TASK-003` | Primitive UI Components Foundation | DONE | Phase 1 | `reports/TASK-003-implementation.md`, `reports/TASK-003-review.md` |
| `TASK-004` | CI Quality-Gates Workflow | DONE | Phase 1 | `reports/TASK-004-implementation.md`, `reports/TASK-004-review.md` |
| `TASK-010A` | Repair Project Baseline | VERIFIED | Phase 1 | `reports/TASK-010A-implementation.md`, `reports/TASK-010A-review.md` |
| `TASK-015` | Apply and Verify Supabase Core Database | VERIFIED | Phase 2 | `reports/TASK-015-implementation.md`, `reports/TASK-015-review.md` |
| `TASK-020` | Authentication Service and API Handlers | VERIFIED | Phase 3 | `reports/TASK-020-implementation.md`, `reports/TASK-020-review.md` |
| `TASK-021` | Auth Pages UI (Login and Register) | VERIFIED | Phase 3 | Git commit (`5f4b7c8`), `src/app/(auth)/`, 12 tests PASS |
| `TASK-022` | Course Catalog and Course Detail | VERIFIED | Phase 3 | `reports/TASK-022-implementation.md`, `reports/TASK-022-review.md` |
| `TASK-023` | Course Enrollment Feature & API Integration | VERIFIED | Phase 3 | `reports/TASK-023-implementation.md`, `reports/TASK-023-review.md` |
| `TASK-024` | Visual Learning Roadmap Page | VERIFIED | Phase 3 | `reports/TASK-024-implementation.md`, `reports/TASK-024-review.md` |
| `TASK-025` | Lesson Content API and Viewer | VERIFIED | Phase 4 | `TASK-024`; `reports/TASK-025-implementation.md`, `reports/TASK-025-review.md` |
| `TASK-026` | Exercise API, Evaluation, and Submissions | VERIFIED | Phase 4 | `TASK-025` |
| `TASK-027` | Progress Tracking API and Learner Progress Engine | VERIFIED | Phase 4 | `TASK-026` |

## Ready Queue

| Task ID | Title | Status | Phase | Dependency |
|---|---|---|---|---|
| `TASK-031` | Content Moderation API and Moderation Queue | READY | Phase 6 | `TASK-030` |
| `TASK-032` | Learner Dashboard and Profile Management | READY | Phase 6 | `TASK-027`, `TASK-029` |
| `TASK-033` | User Administration and System Health Dashboard | READY | Phase 6 | `TASK-031` |

## Planned Work

| Phase | Scope |
|---|---|
| Phase 4 | `TASK-025`–`TASK-027` verified: lesson content/start flow, exercises/submissions/grading, and progress engine |
| Phase 5 | `TASK-028`–`TASK-029` verified; `TASK-030` in progress: AI explanations, rule-based learning recommendations, and controlled AI exercise generation |
| Phase 6 | `TASK-031`–`TASK-033` ready: content moderation, learner dashboard/profile, user administration, and system health |
| Phase 7 | Security regression, accessibility/performance review, and deployment |

## Retired Task IDs

The former `TASK-010`–`TASK-014` packets were overlapping database subtasks and are retired. Their verified database scope is represented by `TASK-015`.

The former `TASK-101`–`TASK-105` packets were duplicate or obsolete authentication planning packets and are retired. Their relevant completed work is represented by `TASK-020` and `TASK-021`.

Retired task IDs must not be reintroduced unless a new packet is explicitly created with a distinct scope and acceptance criteria.