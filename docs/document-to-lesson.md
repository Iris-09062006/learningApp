# Document-to-Lesson — Product and Technical Contract

## TASK-050 extension — Separate new and existing course flows

- The UI exposes two independent choices: `Tạo course mới` and
  `Thêm vào course hiện có`; it never shows the former shared chapter/bootstrap block.
- New mode asks only for a course title. After upload, the server derives the chapter
  title from the original filename without its final extension and atomically creates
  an unpublished course, chapter, and initial lesson.
- Existing mode asks for an existing course. It derives the same chapter title and
  atomically appends an unpublished chapter plus initial lesson to that course.
- Both RPC paths validate again, authorize an active Admin, use an empty search path,
  and write an audit log. Existing curriculum is preserved.
- Editing, deletion, reordering, and broad curriculum CRUD remain out of scope.

## TASK-046 extension — New lesson targets and resilient responses

- Admin may select an existing lesson or create a new target inside an existing
  chapter before generation.
- New targets are created server-side through `create_lesson_content_target`; clients
  provide only `chapterId` and a trimmed title of 1–150 characters.
- The RPC authorizes an active Admin, locks the chapter, allocates the next
  `lesson_order`, inserts `is_published = false`, and writes an Admin audit log. The
  lesson stays hidden until the approved draft is published by the existing RPC.
- HTML or malformed provider/gateway responses are invalid upstream responses. The UI
  shows a stable retry message and always clears the loading announcement.

## 1. Outcome

Biến tài liệu do Admin cung cấp thành nội dung bài học có thể kiểm chứng mà không đưa
AI vào đường publish trực tiếp. Đầu ra cuối cùng là một lesson đã được Admin duyệt,
gắn vào course/chapter xác định và chỉ xuất hiện trong catalog sau một transaction
publish thành công.

## 2. Actors and authorization

- `admin`: upload, extract, generate, edit, review, publish và archive.
- `moderator`: không có quyền trong phiên bản đầu của pipeline này; luồng bài tập AI
  hiện hữu vẫn giữ nguyên.
- `learner`/guest: không được truy cập source object, extracted text, draft, prompt,
  provider response hoặc review history.
- Mọi authorization được kiểm tra ở server và RLS; UI role check không phải security
  boundary.

## 3. Supported sources

- MIME: `text/plain`, `text/markdown`, `application/pdf`,
  `application/vnd.openxmlformats-officedocument.wordprocessingml.document`.
- Kích thước tối đa: 10 MiB mỗi file.
- PDF phải có text layer; DOCX chỉ trích xuất nội dung văn bản. Không OCR, không macro,
  không chạy embedded object và không render HTML từ tài liệu.
- Tên object do server tạo theo `{adminId}/{documentId}/{sanitizedFilename}`; client
  không quyết định bucket hoặc đường dẫn cuối cùng.

## 4. State machines

### Source document

```text
uploaded → extracting → extracted → generating → ready_for_review
                  ↘ failed ←───────────────↗
ready_for_review → archived
```

### Lesson draft

```text
pending_review → needs_revision → pending_review
              ↘ rejected
              ↘ approved → published
```

Không được nhảy trực tiếp từ `pending_review` hoặc `needs_revision` sang `published`.

## 5. Extraction and citations

1. Server tải object từ private Storage sau khi xác thực Admin.
2. Parser phù hợp MIME trả plain text; normalize line endings và bỏ NUL/control chars.
3. Text rỗng hoặc vượt giới hạn 200.000 ký tự bị từ chối.
4. Chunk theo paragraph, tối đa 4.000 ký tự/chunk với overlap có kiểm soát; mỗi chunk
   có `chunk_index`, `start_offset`, `end_offset` và hash.
5. Structured AI output tham chiếu citation bằng `chunkIndex`; server resolve sang
   `document_chunk_id` và lưu snapshot quote ngắn. Citation ngoài tập context bị reject.

## 6. Structured draft contract

```json
{
  "title": "string",
  "summary": "string",
  "estimatedMinutes": 15,
  "sections": [
    {
      "heading": "string",
      "bodyMarkdown": "string",
      "citationChunkIndexes": [0]
    }
  ]
}
```

Ràng buộc:

- Không có field ngoài schema; title/heading/body không rỗng.
- Có 1–12 sections; mỗi section có ít nhất một citation hợp lệ.
- `estimatedMinutes` từ 1–180.
- Markdown được coi là dữ liệu, không thực thi HTML/script.
- Prompt coi toàn bộ source text là dữ liệu không tin cậy và bỏ qua instruction nằm
  trong tài liệu.

## 7. Review and edit

- Admin chọn course, chapter và lesson đích trước khi generate.
- Một draft giữ immutable generation snapshot; mỗi chỉnh sửa tạo revision tăng dần.
- Review lưu reviewer, decision, comment và revision được duyệt.
- Thay đổi nội dung sau approve tự động đưa draft về `pending_review`.
- UI phải hiển thị source filename, extraction status, provider/model, từng citation,
  bản xem trước draft, validation errors và lịch sử review.

## 8. Transactional publish

RPC publish khóa draft, lesson, chapter và course liên quan rồi kiểm tra:

- actor là active Admin;
- draft đang `approved`, chưa publish và revision hiện tại đúng revision đã approve;
- target lesson/chapter/course tồn tại và quan hệ cha con khớp;
- mỗi section còn ít nhất một citation hợp lệ thuộc source document;
- source document chưa archived.

Transaction cập nhật lesson content/title/estimated minutes, ghi publication và audit
log, đánh dấu lesson/chapter publish. Course chỉ được đặt `is_published = true` khi mọi
chapter và lesson của course đều đã publish. RPC idempotent: gọi lại draft đã publish
trả cùng lesson/publication, không tạo bản sao.

## 9. API surface

- `POST /api/admin/content-sources` — multipart upload.
- `POST /api/admin/content-sources/:id/extract` — parse và persist chunks.
- `POST /api/admin/content-sources/:id/generate` — tạo draft cho target lesson.
- `GET /api/admin/lesson-drafts` — queue có phân trang/status filter.
- `GET /api/admin/lesson-drafts/:id` — draft, citations và review history.
- `PATCH /api/admin/lesson-drafts/:id` — lưu revision đã chỉnh sửa.
- `POST /api/admin/lesson-drafts/:id/reviews` — approve/reject/needs_revision.
- `POST /api/admin/lesson-drafts/:id/publish` — gọi transactional RPC.

Tất cả endpoint dùng response envelope chuẩn, validate server-side, `Cache-Control:
no-store` và không trả storage path ký vĩnh viễn.

## 10. 9Router runtime

- Adapter dùng `AI_PROVIDER_URL`, `AI_API_KEY`, `AI_PROVIDER_MODEL` hiện hữu; production
  URL phải truy cập được từ server runtime, không dùng `localhost` nếu app chạy Vercel.
- Request dùng OpenAI-compatible chat completions và `response_format` JSON Schema khi
  route/model hỗ trợ; server vẫn parse và validate lại toàn bộ response.
- Timeout 45 giây và không retry tự động trong request; Admin có thể chạy lại source
  ở trạng thái failed sau khi xử lý lỗi provider.
- Không log source text, prompt đầy đủ, API key hoặc raw provider response.

## 11. Operational gates

- Migration và RLS được kiểm tra trên Supabase Cloud bằng MCP.
- Chạy security/performance advisors sau DDL và xử lý findings trong scope.
- Test dùng mock provider/parser; không gửi tài liệu test đến AI thật.
- Source object orphan do transaction thất bại được đánh dấu để archive/cleanup, không
  xóa tự động trong request path.
