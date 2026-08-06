# TASK-035 — Re-verification of BLOCKED Status

**Date:** 8/6/2026 (Asia/Bangkok)

**Verdict:** `BLOCKED` (giữ nguyên) — blockers chưa được giải quyết.

## Re-verification checks

| Check | Result |
|---|---|
| `tasks/TASK-035.md` status | `BLOCKED` — 4 contract decisions vẫn là điều kiện bắt buộc trước `READY` |
| `docs/features.md` — F-AUTH-04 (dòng 160-171) | Vẫn là luồng generic 5 bước; **không** ghi nhận quyết định nào về route/API names, redirect allowlist, server-mediated vs SSR callback flow, hoặc rate limit/generic response/inactive user |
| `project/TASKS.md` | TASK-035 = `BLOCKED` |
| Git log | Không có commit nào thêm quyết định contract cho F-AUTH-04 |
| Task packet constraint | *"Không tự thêm endpoint trước khi các quyết định trên được ghi vào source of truth"* |

## Kết luận

4 quyết định contract cần thiết (route/API names, recovery redirect allowlist cho local/Preview/Production, cơ chế server-mediated vs Supabase SSR callback/session flow, quy định rate limit + generic response chống account enumeration + hành vi với inactive user) vẫn chưa được ghi vào source of truth.

Đây là quyết định sản phẩm quan trọng **không thể suy ra an toàn** từ source of truth hiện có, và task packet cấm tự thêm endpoint trước khi chúng được ghi nhận. Do đó không thể chuyển sang IMPLEMENT.

## Cần làm để unblock (do người dùng quyết định sản phẩm)

1. Khóa tên route/API cho request recovery và update password (ví dụ: `POST /api/auth/recovery` + `POST /api/auth/recovery/update`, hoặc tên khác theo chuẩn dự án).
2. Khóa allowlist recovery redirect URL cho local, Preview và Production (ghi vào docs + env).
3. Chọn server-mediated hay Supabase SSR callback/session flow.
4. Quy định rate limit, generic response chống account enumeration, và hành vi với inactive user.

Sau khi các quyết định trên được ghi vào `docs/features.md` (F-AUTH-04) và/hoặc `docs/api_contract.md` + `docs/security.md`, TASK-035 có thể chuyển `READY` và tiếp tục IMPLEMENT → TEST → REVIEW → COMMIT.

## Phần đã hoàn thành

- PLAN: đã xác minh đầy đủ dependencies (TASK-020/021 verified), trạng thái repository và blocker.
- Không có thay đổi code nào được tạo (đúng constraint của task packet).