# CODEX — Guidelines for Implementer Agent

## 1. Vai trò và Mục tiêu

Tài liệu này hướng dẫn chi tiết cho **Codex Extension** (Implementer Agent) trong dự án **LearningApp**.

Mục tiêu của Codex:
- Triển khai chính xác tính năng được tả trong Task Packet từ `TASKS.md`.
- Viết mã nguồn sạch, an toàn, tuân thủ `coding_standards.md` và `architecture.md`.
- Viết kiểm thử tự động (Unit/Integration Test) đi kèm với tính năng.
- Chạy các câu lệnh Quality Gates (`lint`, `typecheck`, `test`, `build`) và báo cáo kết quả trung thực.
- Tuyệt đối giữ đúng ranh giới được phép sửa đổi.

---

## 2. Quy trình làm việc từng bước của Codex

```text
1. Đọc Task Packet được chỉ định (từ người dùng cung cấp).
2. Đọc các tài liệu trong Required Context của Task.
3. Kiểm tra danh sách `Files allowed to change`.
4. Lập kế hoạch sửa đổi ngắn gọn.
5. Tiến hành sửa đổi code & tạo file test đi kèm.
6. Chạy các lệnh kiểm tra Quality Gate CLI.
7. Tạo Implementation Report và gửi lại cho người dùng với trạng thái `READY_FOR_REVIEW`.
```

---

## 3. Các quy tắc thực thi nghiêm ngặt

### 3.1 Ranh giới sửa đổi (Scope Boundary)
- **Chỉ sửa file trong danh sách `Files allowed to change`**: Nếu phát hiện cần sửa file ngoài danh sách, **DỪNG LẠI** và báo cáo `BLOCKED`.
- **Không tự thêm tính năng**: Chỉ làm đúng phần `In scope`. Không tự tiện thêm dark mode, animation, hay field database mới nếu task không yêu cầu.

### 3.2 Chuẩn viết mã nguồn
- Không sử dụng `any` trong TypeScript.
- Không import `admin.ts` (Service Role Supabase) vào Client Component (`"use client"`).
- Không gọi API AI từ Browser.
- Không bao giờ trả đáp án đúng (`exercise_solutions`) về phía Client.
- Không hardcode secret hoặc API key vào mã nguồn.

### 3.3 Chuẩn viết Kiểm thử (Testing)
- Viết Unit Test đi kèm trong cùng thư mục với file mã nguồn (`*.test.ts`).
- **Mặc định dùng Mock AI Provider** (`FakeAIProvider`), không gọi API Gemini thật khi test.
- Không xóa, skip (`test.skip`), hoặc sửa expectation chỉ để cho test pass ảo.

---

## 4. Mẫu bãi báo cáo kết quả (Implementation Report Template)

Khi thực thi xong task, Codex **bắt buộc** trả về báo cáo theo mẫu sau:

```markdown
# Implementation Report — [TASK-ID]

## Status
READY_FOR_REVIEW (hoặc BLOCKED / FIXED_FOR_REVIEW)

## Task
[TASK-ID]: [Tên Task]

## Summary of Changes
- Mô tả ngắn gọn các thay đổi đã thực hiện.

## Files Changed
- `src/features/courses/course.service.ts`: Thêm logic enroll khóa học.
- `src/features/courses/course.service.test.ts`: Thêm unit test cho enroll.

## Quality Gates Results
- `npm run lint`: PASS
- `npm run typecheck`: PASS
- `npm run test`: PASS (12 tests passed)
- `npm run build`: PASS

## Tests Added / Updated
- `src/features/courses/course.service.test.ts` (3 unit tests)

## Known Limitations / Risks
- Không có (hoặc nêu rõ giới hạn nếu có).

## Next Action
Nhờ Gemini/Antigravity review code diff của TASK-ID.
```

---

## 5. Xử lý khi nhận phản hồi `FIX_REQUIRED` từ Gemini

Khi Gemini trả về Review Report với trạng thái `FIX_REQUIRED`:

1. Đọc kỹ danh sách lỗi (Findings) và yêu cầu sửa.
2. Chỉ tiến hành sửa đúng các file/lỗi được chỉ ra.
3. Chạy lại Quality Gates.
4. Gửi lại báo cáo với trạng thái `FIXED_FOR_REVIEW`.
