# Product Requirements Document (PRD)

## TASK-056 clarification — Admin learner removal and course deletion

- Active Admin can “Đuổi học viên” by deactivating the target account. This is a
  reversible access-removal action; Auth users and learning history are not hard-deleted.
- Active Admin can delete a Course from the product. Deletion is implemented as an
  atomic archive: Course, Chapters, Lessons, and Exercises are unpublished and the
  Course is hidden from catalog/Admin lists while enrollments, progress, submissions,
  draft/source history, and audit evidence remain intact.
- Both actions require server/database authorization, confirmation in the UI, and an
  `admin_logs` entry. Existing last-active-admin protection remains mandatory.

## Product decision — AI Course và AI Exercise là hai pipeline độc lập

Quyết định này supersede phần AI-generation của TASK-055.

- PDF import bắt buộc đi qua: upload → extract → AI outline → Admin outline review/edit
  → generate Lesson contents → Admin Course review/edit → atomic publish.
- Upload/extract/outline không tạo official Course/Lesson và không tạo Exercise. Outline
  chỉ chứa Course metadata, learning objectives và cấu trúc Lesson có source references.
- Admin có thể add/remove/reorder Lesson, regenerate outline và chỉ action Continue mới
  cho phép sinh content. Sau đó Admin có thể sửa hoặc regenerate riêng từng Lesson.
- Publish tạo official Course + Lessons trong một transaction. Publish/reject resolve
  review item bền vững; reload không làm item quay lại và lịch sử draft/source vẫn còn.
- Exercise chỉ được sinh từ một Published/Approved Lesson, dùng Lesson context làm nguồn
  chính, persist đúng `lesson_id`, rồi đi qua review/edit/publish riêng.
- Không API/prompt/schema/review action nào được tạo hoặc duyệt Course và Exercise cùng
  một pipeline.

## 1. Tổng quan dự án

- **Tên dự án:** LearningApp (Nền tảng học lập trình Python tương tác tích hợp AI).
- **Mục tiêu:** Xây dựng nền tảng học lập trình Python ngắn gọn, trực quan, theo lộ trình rõ ràng, kết hợp bài tập tương tác và trợ lý AI (AI Mentor) giải thích đáp án giúp người mới bắt đầu tiến bộ nhanh chóng.
- **Đối tượng sử dụng:**
  - **Learner (Người học):** Người mới bắt đầu học Python, muốn học qua lộ trình bài học ngắn và thực hành bài tập ngay.
  - **Moderator (Người kiểm duyệt):** Kiểm duyệt nội dung bài tập do AI khởi tạo trước khi xuất bản.
  - **Admin (Quản trị viên):** Quản lý người dùng, phân quyền và theo dõi trạng thái hệ thống.

---

## 2. Phạm vi sản phẩm (Product Scope)

### 2.1 Thuộc phạm vi MVP (In Scope for Core MVP)

1. **Tài khoản & Phân quyền:**
   - Đăng ký, đăng nhập, đăng xuất (Supabase Auth).
   - Phân quyền theo vai trò (Learner, Moderator, Admin).
2. **Khóa học & Lộ trình (Catalog & Roadmap):**
   - Danh sách khóa học công khai.
   - Lộ trình bài học (Roadmap) trực quan dạng các chặng/bài học.
   - Đăng ký học (Enrollment) và tự động mở khóa bài học đầu tiên.
3. **Bài học & Bài tập (Lesson & Exercises):**
   - Đọc nội dung bài học.
   - Bài tập **Predict the Output** (Dự đoán kết quả đoạn code - Trắc nghiệm).
   - Bài tập **Fix the Bug** (Sửa lỗi đoạn code - Chọn cú pháp đúng).
4. **Nộp bài & Tiến độ (Submission & Progress):**
   - Chấm bài tập tĩnh phía Server.
   - Phản hồi Đúng/Sai ngay lập tức.
   - Tự động mở khóa bài học tiếp theo khi hoàn thành tất cả bài tập bắt buộc trong bài học hiện tại.
5. **AI Mentor:**
   - Hỗ trợ giải thích lý do đáp án sai dựa trên bối cảnh bài tập và bài nộp của người học.
   - Xử lý hoàn toàn ở Server, không lộ API Key, có timeout và fallback an toàn khi AI lỗi.

### 2.2 Thuộc phạm vi mở rộng P1 (Operations Extension)

1. **Quản lý & Kiểm duyệt nội dung AI:**
   - Sinh bài tập bằng AI (AI Exercise Generation).
   - Hàng duyệt bài tập AI cho Moderator (Approve / Reject / Needs Revision).
   - Xuất bản bài tập đã duyệt vào khóa học.
2. **Quản trị người dùng (Admin):**
   - Xem danh sách người dùng, tìm kiếm, lọc theo vai trò.
   - Thay đổi vai trò người dùng (Learner <-> Moderator <-> Admin).
   - Kích hoạt / Vô hiệu hóa tài khoản người dùng.
   - Ghi Log quản trị (Audit Log).
3. **PDF-to-Course (Admin Content Pipeline):**
   - Admin tải tài liệu nguồn lên vùng lưu trữ riêng tư; learner và guest không được
     đọc object hoặc nội dung trích xuất.
   - Hệ thống trích xuất văn bản có giới hạn, chia thành các đoạn nguồn ổn định và
     lưu provenance để phục vụ citation; MVP không thực hiện OCR.
   - Server gửi các đoạn nguồn cần thiết đến provider để tạo Course outline đã validate;
     không sinh full Lesson content hoặc Exercise ở bước này.
   - Admin review/edit/add/remove/reorder outline. Chỉ approved outline revision mới được
     dùng để generate content riêng cho từng Lesson.
   - Mỗi Lesson content draft có citation hợp lệ, revision và action regenerate độc lập;
     output sai schema/source reference bị từ chối. AI không được tự publish.
   - Publish chạy trong một transaction để tạo Course/Chapter/Lessons official, publication
     mappings và audit evidence. Course chỉ xuất hiện sau khi toàn transaction hoàn tất.
4. **Lesson-to-Exercises:**
   - Active Moderator/Admin bắt đầu generation từ một Lesson cụ thể, không từ Course/PDF.
   - Exercise draft persist đúng `lesson_id`, qua review/edit/approve trước publish và
     không hiển thị cho learner khi chưa publish.

### 2.3 Ngoài phạm vi MVP (Out of Scope)

- Ứng dụng di động native (iOS / Android).
- Thanh toán / Đăng ký gói trả phí (Subscription / Payment).
- Trình soạn thảo IDE đầy đủ / Chạy code Python trực tiếp trên server (Code Execution Sandbox).
- Mạng xã hội / Bảng xếp hạng thi đấu phức tạp.
- Kỹ thuật RAG phức tạp (MVP sử dụng Direct Context Injection).
- OCR tài liệu scan, crawler URL, đồng bộ Google Drive và vector search đa tài liệu.

---

## 3. MVP Boundary (Ranh giới MVP)

Để đảm bảo tính khả thi và chất lượng dự án, ranh giới MVP được quy định rõ:

| Tính năng | Trong MVP (P0) | Mở rộng (P1) | Không làm (Out of Scope) |
|---|---|---|---|
| Dạng bài tập | Predict Output & Fix Bug (Chọn lựa chọn) | Fix Bug (Kéo thả) | Code Execution tự do |
| Chấm bài | So sánh đáp án tĩnh ở Server | - | Sandbox đếm thời gian thực thi |
| Trợ lý AI | Giải thích đáp án sai theo bối cảnh | Lưu lịch sử giải thích chi tiết | RAG trên toàn bộ tài liệu |
| Tạo bài tập AI | - | Lesson → Exercise drafts → review/edit → publish | Sinh theo Course/PDF hoặc tự động publish |
| PDF-to-Course | - | Upload → extraction → outline review → Lesson generation → Course review → transactional publish | Exercise trong import, AI tự publish, OCR hoặc RAG đa tài liệu |
| Phân quyền | RLS + Session + Service checks | Quản lý User + Audit Log | Quản lý permission matrix phức tạp |
