# Active Task Queue

- **Active task:** `TASK-035` — Self-service Password Recovery (`IN_PROGRESS`)
- **Last verified task:** `TASK-042` — Restore Public Onboarding and Product Navigation
- **Next task:** `TASK-036` — Accessible Fix-the-Bug Drag-and-Drop
- **Next status:** `READY`
- **Owner:** Codex

## Planning baseline

- Phase 0–6 và `TASK-034` đã hoàn tất, verified.
- Các feature đã có dù roadmap cũ chưa chỉ rõ: submission history, AI explanation history, rule-based learning recommendation, profile update, admin user management, audit writes và system health.
- Feature gap còn lại được tách thành `TASK-034`–`TASK-037`.
- Phase 7 được tách thành `TASK-038`–`TASK-041`.
- Không có push hoặc deployment nào được phép trong vòng lập kế hoạch này.

## Start condition

`TASK-035` đang `IN_PROGRESS`: blockers đã được gỡ bằng ADR-024 (Accepted); implementation + tests hoàn tất, đang chờ review → commit. Sau khi `TASK-035` `VERIFIED`, queue quay lại `TASK-036`.