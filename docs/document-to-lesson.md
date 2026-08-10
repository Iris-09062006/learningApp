# PDF-to-Course — Product and Technical Contract

## 1. Outcome

Một tài liệu do Admin tải lên được chuyển thành đúng một Course chưa xuất bản và
một danh sách Lesson có thứ tự. AI chỉ phân tích các chủ đề cốt lõi, bỏ nội dung
không phù hợp và viết Course/Lesson draft có citation. Pipeline này tuyệt đối không
tạo bài tập.

Course batch phải qua Admin review. `approved` đồng nghĩa với việc Course và toàn bộ
Lesson được xuất bản trong một transaction; `rejected` được lưu vĩnh viễn nhưng không
hiện trong hàng chờ. Bài tập được sinh ở một flow khác, cho đúng một Lesson đã chọn.

## 2. Actors and authorization

- Active `admin`: upload, extract, generate Course batch, edit Lesson draft, review,
  approve/publish hoặc reject.
- Active `moderator` hoặc `admin`: sinh bài tập cho một Lesson và dùng hàng moderation
  hiện hữu để review/publish bài tập.
- Learner/guest: không truy cập source object, chunks, drafts, prompts, provider output
  hoặc review history.
- Server kiểm tra session, `profiles.role` và `profiles.is_active` trước khi đọc nội
  dung đặc quyền hoặc gọi AI. Client-side role checks không phải security boundary.

## 3. Source and state

- MIME hỗ trợ: plain text, Markdown, PDF có text layer và DOCX.
- Giới hạn: 10 MiB/file, tối đa 200.000 ký tự trích xuất; không OCR.
- Storage bucket là private. Source text được chuẩn hóa, chunk và lưu hash/citation.

```text
uploaded → extracting → extracted → generating → ready_for_review
                  ↘ failed ←──────────────────↗
ready_for_review → archived   (approve hoặc reject)
```

Mỗi Lesson draft dùng state hiện hữu:

```text
pending_review ↔ needs_revision
pending_review → rejected
pending_review → approved → published
```

## 4. Structured Course draft

```json
{
  "title": "Python nền tảng",
  "description": "Khóa học nhập môn",
  "lessons": [
    {
      "title": "Biến",
      "summary": "Khái niệm và phép gán",
      "estimatedMinutes": 12,
      "sections": [
        {
          "heading": "Khái niệm",
          "bodyMarkdown": "...",
          "citationChunkIndexes": [0]
        }
      ]
    }
  ]
}
```

Ràng buộc:

- 2–20 Lesson/Course; mỗi Lesson có 1–12 section và 1–180 phút.
- Mỗi section có ít nhất một citation thuộc các chunks đã gửi cho provider.
- Schema không có `exercise`, `quiz`, `question`, `answer` hoặc `solution`.
- Prompt yêu cầu bỏ nội dung lặp, quảng cáo, hành chính, đáp án mẫu và phần không thể
  dạy thành Lesson; source text luôn là dữ liệu không tin cậy, không phải instruction.
- Server parse và validate lại toàn bộ output trước khi ghi database.

## 5. Atomic persistence

RPC `create_course_lesson_drafts` khóa source ở trạng thái `generating` rồi tạo trong
cùng một transaction:

1. một `courses` row chưa publish;
2. một Chapter `Nội dung chính` chưa publish để tuân theo schema Course → Chapter → Lesson;
3. các `lessons` row chưa publish theo đúng thứ tự AI trả về;
4. một `lesson_drafts` row cho mỗi Lesson;
5. các `lesson_draft_citations` trỏ đúng `document_chunks` của source.

Nếu bất kỳ Lesson hoặc citation nào không hợp lệ, toàn bộ transaction rollback. RPC
không ghi `exercises` hoặc `generated_exercises`.

## 6. Review queue and resolution

- `GET /api/admin/course-drafts` chỉ trả batch có Lesson draft ở
  `pending_review|needs_revision` và source `ready_for_review`.
- UI hiển thị metadata Course, filename, danh sách Lesson có thứ tự, summary, thời
  lượng và nội dung/citation của từng Lesson.
- Lesson draft có thể sửa qua endpoint revision hiện hữu; citation set không được đổi.
- `POST /api/admin/course-drafts/:sourceDocumentId/reviews` nhận `approved`, `rejected`
  hoặc `needs_revision`.
- Approve ghi review cho từng Lesson, gọi publish Lesson cho từng draft, publish Chapter
  và Course khi invariant đạt, ghi publication/audit log, rồi archive source — tất cả
  trong một transaction.
- Reject ghi review cho từng Lesson, giữ Course/Lesson chưa publish và archive source.
- Vì hàng chờ lọc theo unresolved state, approve/reject biến mất ngay và vẫn biến mất
  sau reload; records lịch sử không bị xóa.

## 7. Lesson-scoped exercise generation

Flow bài tập độc lập:

```text
Admin/Moderator chọn một Lesson đã publish
→ POST /api/ai/exercises/generate với lessonId
→ server kiểm tra active role
→ đọc title/content hiện tại của đúng Lesson
→ gọi exercise provider
→ insert generated_exercises.lesson_id = lessonId, status = pending
→ review/publish riêng tại /moderation
```

Không có flow sinh bài tập theo Course, không dùng nội dung tổng hợp của nhiều Lesson,
và không tự publish bài tập.

## 8. API surface

- `POST /api/admin/content-sources` — upload private source.
- `POST /api/admin/content-sources/:id/extract` — extract và persist chunks.
- `POST /api/admin/content-sources/:id/generate` với body `{}` — tạo Course batch.
- `GET /api/admin/course-drafts` — unresolved Course review queue.
- `POST /api/admin/course-drafts/:id/reviews` — resolve cả batch.
- `GET/PATCH /api/admin/lesson-drafts/:id` — đọc/sửa một Lesson draft trong batch.
- `POST /api/ai/exercises/generate` — sinh một bài tập cho một `lessonId`.
- `/api/moderation/generated-exercises/**` — review/publish bài tập riêng.

Các endpoint Admin dùng response envelope, `Cache-Control: no-store` và server-side
validation. Provider chỉ được gọi từ server; source text, prompt, key và raw response
không được log hoặc trả về client.

## 9. Compatibility

Các RPC/endpoint one-Lesson cũ được giữ để không phá dữ liệu và workflow lịch sử,
nhưng Admin UI mặc định dùng PDF-to-Course batch. Migration `023` là forward-only và
không sửa migrations `001`–`022`.
