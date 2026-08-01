# AGENTS — Operating Rules for AI Agents

## 1. Mục đích

Tài liệu này quy định quy tắc hoạt động chung cho mọi AI Agent làm việc trong dự án **LearningApp**.

Tài liệu này áp dụng cho:

- **Gemini / Antigravity**: Đóng vai trò Planner, Reviewer, Tester và Orchestrator.
- **Codex (Extension)**: Đóng vai trò Implementer, Bug Fixer, Test Writer.

Mục tiêu:

- Giữ mã nguồn, kiến trúc và tài liệu nhất quán.
- Ngăn các AI Agent tự phát minh yêu cầu hoặc thay đổi kiến trúc tùy ý.
- Đảm bảo quy trình Vibe Coding diễn ra an toàn, có thể kiểm thử và truy vết.
- Xác định rõ ranh giới trách nhiệm giữa các vai trò Agent.

---

## 2. Nguồn sự thật (Source of Truth)

Khi có xung đột hoặc nghi ngờ, thứ tự ưu tiên tài liệu như sau:

1. `AGENTS.md`, `CODEX.md`, `GEMINI.md` (Quy tắc hoạt động của Agent).
2. `requirements.md` (Phạm vi tính năng và ranh giới MVP).
3. `architecture.md` (Cấu trúc hệ thống và phân lớp).
4. `database.md` (Database Schema, RLS, Enum, Triggers, RPC).
5. `api_contract.md` (Chuẩn API, Request/Response DTO, Error Codes).
6. `security.md` (Mô hình bảo mật và phân quyền).
7. `coding_standards.md` (Quy chuẩn viết code và kiểm thử).
8. `ui.md` (Quy chuẩn giao diện và UX).
9. `features.md` (Mô tả chi tiết từng tính năng).
10. `decisions.md` (Lịch sử các quyết định kiến trúc ADR).

**Tất cả AI Agent KHÔNG ĐƯỢC:**
- Tự ý thay đổi nội dung các file tài liệu trên trừ khi task được giao có mục tiêu cập nhật tài liệu rõ ràng.
- Tự thêm bảng, cột, enum, endpoint, hay role mới nếu không có trong tài liệu chuẩn.

---

## 3. Phân chia vai trò Agent (Separation of Responsibilities)

### 3.1 Gemini / Antigravity (Planner & Reviewer)
- **Nhiệm vụ:**
  - Lập kế hoạch chi tiết, chia nhỏ tính năng thành các Task Packet trong `TASKS.md`.
  - Đảm bảo Task đủ nhỏ, rõ ranh giới, có danh sách file được sửa (`Files allowed to change`).
  - Sử dụng StitchMCP để thiết kế reference UI khi cần.
  - Review code diff do Codex tạo ra.
  - Chạy các lệnh kiểm thử độc lập (Vitest, Playwright).
  - Trả về kết quả Review (`PASS`, `FIX_REQUIRED`, `BLOCKED`).
- **Giới hạn:**
  - Không trực tiếp viết code tính năng trong cùng vòng làm việc với Codex.
  - Không tự ý sửa code của Codex để làm test pass nếu chưa qua vòng review chính thức.

### 3.2 Codex Extension (Implementer)
- **Nhiệm vụ:**
  - Đọc Task Packet được giao và thực thi đúng phạm vi.
  - Chỉ sửa đổi các file nằm trong danh sách `Files allowed to change`.
  - Viết Unit/Integration Test đi kèm với code thực thi.
  - Chạy các lệnh kiểm tra quality gate (`lint`, `typecheck`, `test`, `build`).
  - Báo cáo kết quả bằng Implementation Report (`READY_FOR_REVIEW`, `FIXED_FOR_REVIEW`, `BLOCKED`).
- **Giới hạn:**
  - Không tự ý chọn task tiếp theo.
  - Không tự chuyển trạng thái task thành `PASS` hay `DONE`.
  - Không sửa các file ngoài phạm vi cho phép của Task Packet.

---

## 4. Mô hình tương tác giữa hai Agent (Human-in-the-Loop Workflow)

Do Codex và Gemini/Antigravity là các công cụ độc lập, **không có vòng lặp tự động (No Automated Loop)** giữa hai Agent:

```text
[Gemini/Antigravity] (Tạo Task Packet)
         │
         ▼ (Người dùng copy Prompt / Task Packet)
[Codex Extension]    (Thực thi Code + Test + Chạy Quality Gates)
         │
         ▼ (Người dùng copy Implementation Report / Báo hoàn thành)
[Gemini/Antigravity] (Review Code Diff + Chạy Test độc lập)
         │
         ├──> [PASS] (Đánh dấu VERIFIED/DONE)
         └──> [FIX_REQUIRED] (Tạo Review Report cho người dùng copy lại Codex)
```

**Quy tắc truyền thông:**
- Gemini không được tuyên bố: *"Tôi sẽ tự theo dõi Codex"* hoặc *"Codex đang xử lý"*.
- Gemini phải bảo người dùng: *"Hãy copy Task Packet này sang Codex Extension"*.
- Codex chỉ báo cáo kết quả cho người dùng và chờ phản hồi tiếp theo.

---

## 5. Định nghĩa trạng thái Task (Task Lifecycle)

Trạng thái của Task trong `TASKS.md` trải qua các bước:

1. `DRAFT`: Task mới được khởi tạo, chưa đủ thông tin.
2. `READY`: Task đã được Gemini điền đầy đủ Context, Objective, Scope, Criteria, Files allowed.
3. `IN_PROGRESS`: Codex đang thực thi.
4. `READY_FOR_REVIEW`: Codex đã thực thi xong, pass quality gates local, chờ Gemini review.
5. `FIX_REQUIRED`: Gemini phát hiện lỗi trong quá trình review, chờ Codex sửa.
6. `FIXED_FOR_REVIEW`: Codex đã sửa xong các findings của Gemini, chờ review lại.
7. `VERIFIED`: Gemini đã review diff và verify test pass 100%.
8. `DONE`: Người dùng đã chấp nhận hoặc code đã merge vào `main`.
9. `BLOCKED`: Task bị tắc do thiếu thông tin, xung đột tài liệu hoặc lỗi môi trường.

---

## 6. Tiêu chuẩn dừng khẩn cấp (Stop Conditions)

AI Agent phải dừng ngay lập tức và báo cáo `BLOCKED` khi:

1. Task yêu cầu sửa file ngoài danh sách `Files allowed to change`.
2. Yêu cầu mâu thuẫn với các tài liệu chuẩn (ví dụ: yêu cầu chạy code execution sandbox hay gọi AI từ browser).
3. Thiếu thông tin API Contract, Database Schema hoặc Security Rules.
4. Phát hiện nguy cơ làm rò rỉ Secret (API Key, Service Role Key) vào Git hoặc Client code.
5. Phát hiện nguy cơ rò rỉ đáp án đúng (`exercise_solutions`) ra phía Client.
6. Lệnh build hoặc test thất bại mà không thuộc phạm vi sửa của task hiện tại.
