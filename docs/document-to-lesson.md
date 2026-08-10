# PDF-to-Course and Lesson-to-Exercises Contract

Tên file được giữ để không làm hỏng liên kết lịch sử. Nội dung này là contract chuẩn cho
hai AI pipeline độc lập và supersede flow TASK-055 một-stage.

## 1. Current-state trace

```text
Current Course flow:
upload → extract/chunk → one AI call creates Course metadata + full Lesson contents
→ create unpublished Course/Chapter/Lessons/drafts → batch review → atomic publish

Current Exercise flow:
selected published Lesson → AI generation → generated_exercises.lesson_id
→ Exercise moderation → atomic publish
```

Sai khác của Course flow hiện tại:

- Không có outline-only output hoặc outline review checkpoint.
- Admin chưa add/remove/reorder Lesson trước content generation.
- Không có action Continue khóa approved outline revision.
- Không regenerate content độc lập cho một Lesson từ approved outline.
- Official unpublished curriculum được tạo trước publish thay vì chỉ tạo draft model.

Exercise flow hiện đã đúng boundary chính: một Lesson, đúng `lesson_id`, moderation riêng.

## 2. Pipeline A — PDF to Course

```text
Upload PDF
→ Extract/normalize server-side
→ AI analyze core knowledge
→ Generate Course outline
→ Admin review/edit outline
→ Generate Lesson contents
→ Admin review/edit Course draft
→ Atomic publish Course + Lessons
```

### A1 — Upload and job

Upload tạo private `source_document` và một import/generation job. Không tạo official
Course, Chapter hoặc Lesson. Job/status là server-persisted; browser local state không
phải source of truth.

### A2 — Extract

Server download source, extract/normalize text, chunk, hash và lưu provenance. Raw PDF,
source text, provider secret và raw provider response không trả về client. PDF scan cần
OCR vẫn ngoài scope.

### A3 — Outline generation

Provider chỉ trả structure:

```json
{
  "title": "Python nền tảng",
  "description": "Khóa nhập môn",
  "learningObjectives": ["Hiểu biến và kiểu dữ liệu"],
  "lessons": [
    {
      "clientKey": "lesson-1",
      "title": "Biến",
      "summary": "Khái niệm và phép gán",
      "learningObjectives": ["Khai báo và cập nhật biến"],
      "sourceChunkIndexes": [0, 1]
    }
  ]
}
```

Strict schema từ chối unknown fields, invalid citation và mọi field liên quan
`exercise`, `quiz`, `question`, `answer` hoặc `solution`. Outline không có full Lesson
body.

### A4 — Outline review

Admin có thể sửa Course title/description/objectives; sửa Lesson title/summary/objectives;
add/remove/reorder Lesson; regenerate outline; reject; hoặc Continue. Mọi mutation tạo
revision và persist server-side. Continue khóa approved outline revision rồi mới chuyển
sang content generation.

### A5 — Lesson content generation

Mỗi Lesson được generate từ normalized source, Course metadata, approved outline và các
source sections liên quan. Lesson có thể chạy/retry/regenerate độc lập. Output có title,
summary, estimated time, sections và citations; không có Exercise.

### A6 — Course review

Admin review Course + toàn bộ Lesson content; có thể edit hoặc regenerate riêng Lesson,
remove/add/reorder theo contract revision, reject hoặc đưa draft sang ready-to-publish.
Không action nào tự publish.

### A7 — Publish

Chỉ action Publish từ `ready_to_publish` mới tạo official Course/Chapter/Lessons cùng
publication mappings và audit log trong một transaction. Failure rollback toàn bộ.
Published/rejected item không còn trong pending queue sau reload, nhưng source/job/draft
history vẫn tồn tại.

Canonical semantics:

```text
uploaded → processing → outline_review → generating_content
→ content_review → ready_to_publish → published
                  ↘ failed
outline_review|content_review → rejected
```

## 3. Pipeline B — Lesson to Exercises

```text
Published/Approved Lesson
→ Generate Exercises
→ Exercise Drafts linked to that Lesson
→ Review/Edit
→ Approve/Publish
```

Primary context là Lesson title, learning objectives và content. Course title/description
chỉ là supplementary context khi cần; không gửi toàn PDF theo mặc định. Không generate
ở cấp Course hoặc batch nhiều Lesson. `generated_exercises.lesson_id` và
`exercises.lesson_id` là ownership duy nhất.

Generated Exercise luôn `pending`, không hiển thị cho learner và đi qua moderation riêng.
Publish tạo exercise/options/private solution và cập nhật generated record trong cùng
transaction.

## 4. Review model

Course import review và Exercise draft review là hai domain:

```text
Course import queue: outline/content state, Course/Lesson revisions, Course publish
Exercise queue: generated exercise state, Exercise review, Exercise publish
```

Infrastructure dùng chung phải dừng ở provider adapter, schema utilities, rate limiting
hoặc audit primitives. Không dùng một approve API/service với giả định chung cho hai loại.

## 5. Security and failure rules

- Active Admin duy nhất được mutate Pipeline A; active Moderator/Admin được mutate
  Pipeline B.
- Authorization và distributed rate limit chạy trước context read/provider call.
- Validate request, AI response, state transition và source ownership ở server.
- Provider timeout/invalid output đưa job/draft về retryable failed state, không publish.
- Course publish và Exercise publish là hai transaction riêng; không partial publish.
- AI key, service-role key, source objects và private solutions luôn server-only; RLS và
  RPC authorization vẫn là defense in depth.

## 6. Implementation plan (not implemented by this documentation task)

1. Thêm normalized Course-import job/outline/Lesson-content draft schema và migration.
2. Tách provider schema/prompt outline khỏi provider schema/prompt Lesson content.
3. Thêm endpoint/state transition cho outline edit/regenerate/Continue và per-Lesson
   regenerate; retire `{}` one-stage generate khỏi Admin default flow.
4. Thay UI `/admin/content` bằng outline review rồi Course review; giữ Exercise action ở
   Lesson scope và moderation riêng.
5. Thêm unit/integration/E2E cho state transitions, validation, authorization, timeout,
   rollback, queue persistence và invariant “Course import creates no exercise”.
