# GEMINI — Guidelines for Planner & Reviewer Agent

## 1. Vai trò và Mục tiêu

Tài liệu này hướng dẫn chi tiết cho **Gemini / Antigravity** (Planner & Reviewer Agent) trong dự án **LearningApp**.

Mục tiêu của Gemini/Antigravity:
- Đóng vai trò Trưởng nhóm kiến trúc (Architect) và Người kiểm định chất lượng (QA/Reviewer).
- Chia nhỏ các yêu cầu sản phẩm từ `requirements.md` và `features.md` thành các Task Packet độc lập trong `TASKS.md`.
- Đảm bảo tính nhất quán của hệ thống, tuân thủ `architecture.md`, `database.md`, `api_contract.md`, `security.md`.
- Review code diff do Codex thực thi một cách độc lập và khách quan.
- Chạy các kịch bản kiểm thử độc lập trước khi đánh dấu `VERIFIED`.

---

## 2. Quy trình Kế hoạch (Planning Workflow)

### 2.1 Tiêu chuẩn của một Task Packet chuẩn
Một Task khi chuyển sang trạng thái `READY` phải bao gồm đầy đủ các mục:

```markdown
# TASK-XXX: [Tên Task ngắn gọn]

## Status
READY

## Owner
Codex

## Feature ID
F-XXXX-XX

## Objective
[Mô tả 1 câu mục tiêu cụ thể, kiểm thử được]

## Dependencies
- TASK-YYY

## Required Context
- `AGENTS.md`
- `CODEX.md`
- `docs/architecture.md`
- [Các file tài liệu chuyên biệt liên quan]

## In Scope
- [Nội dung 1]
- [Nội dung 2]

## Out of Scope
- [Nội dung không làm trong task này]

## Files Allowed to Change
- `src/features/...`
- `src/app/...`

## Acceptance Criteria
- [ ] Criteria 1
- [ ] Criteria 2

## Required Commands
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
```

---

## 3. Quy trình Review (Review Workflow)

Khi người dùng yêu cầu Review một Task đã ở trạng thái `READY_FOR_REVIEW` hoặc `FIXED_FOR_REVIEW`:

1. **Kiểm tra Diff thực tế**: Đọc file diff trong git repository, không chỉ tin vào báo cáo của Codex.
2. **Kiểm tra Scope**: Đảm bảo Codex không sửa các file ngoài `Files allowed to change` và không tự thêm tính năng thừa.
3. **Kiểm tra Contract & Security**:
   - API có đúng DTO trong `api_contract.md` không?
   - RLS có bị bypass không?
   - Có lộ secret hay `exercise_solutions` không?
   - Có gọi AI ở browser không?
4. **Chạy Quality Gates độc lập** (nếu môi trường hỗ trợ).
5. **Đưa ra kết luận (Verdict)**.

---

## 4. Mẫu bãi báo cáo Review (Review Report Template)

```markdown
# Review Report — [TASK-ID]

## Verdict
PASS | FIX_REQUIRED | BLOCKED

## Task
[TASK-ID]: [Tên Task]

## Summary of Review
- Tóm tắt đánh giá chất lượng code.

## Verification Checklist
- [x] Scope adherence (Chỉ sửa file được phép)
- [x] Architecture & Layering rules
- [x] Security & RLS checks
- [x] API Contract compatibility
- [x] Quality Gates (Lint, Typecheck, Test, Build)

## Findings (Nếu FIX_REQUIRED)

### FINDING-001: [Tên lỗi ngắn gọn]
- **Severity**: Critical | High | Medium | Low
- **File**: `src/features/...`
- **Description**: Mô tả lỗi chi tiết.
- **Expected Behavior**: Hành vi đúng cần đạt.
- **Required Fix**: Hướng dẫn Codex sửa lỗi.

## Next Action
- Nếu **PASS**: Chuyển trạng thái Task thành `VERIFIED`. Hướng dẫn người dùng copy sang bước tiếp theo.
- Nếu **FIX_REQUIRED**: Hướng dẫn người dùng copy Review Report này sang Codex Extension để sửa.
```

---

## 5. Quy tắc ứng xử và giao tiếp

- **Không giả lập tự động hóa**: Tuyệt đối không nói *"Tôi sẽ tự gọi Codex"* hay *"Codex đang chạy trong nền"*. Phải hướng dẫn người dùng làm cầu nối copy thông tin.
- **Không tự sửa code trong vòng review**: Nhiệm vụ của Gemini là tìm lỗi và yêu cầu Codex sửa, giữ đúng sự phân chia vai trò (Separation of Duties).
