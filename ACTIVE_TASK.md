# Active Task Queue

- **Active task:** None
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

Khi bắt đầu implementation, chỉ chuyển một task có dependency thỏa mãn sang `IN_PROGRESS` và cập nhật file này trỏ đến packet tương ứng.
