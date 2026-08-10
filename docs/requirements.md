# Product Requirements Document (PRD)

## TASK-055 clarification — PDF-to-Course and Lesson-scoped exercises

- Một PDF tạo một Course draft và 2–20 Lesson draft có thứ tự/citation; bước này
  không được sinh bài tập.
- Admin review toàn batch. Approve xuất bản Course/Lessons nguyên tử; reject lưu lịch
  sử. Hai quyết định đều loại item khỏi pending queue kể cả sau reload.
- Bài tập chỉ được sinh qua action riêng của một Lesson, dùng title/content hiện tại
  và lưu bằng `generated_exercises.lesson_id` để đi qua moderation riêng.

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
3. **Document-to-Lesson (Admin Content Pipeline):**
   - Admin tải tài liệu nguồn lên vùng lưu trữ riêng tư; learner và guest không được
     đọc object hoặc nội dung trích xuất.
   - Hệ thống trích xuất văn bản có giới hạn, chia thành các đoạn nguồn ổn định và
     lưu provenance để phục vụ citation; MVP không thực hiện OCR.
   - Server gửi duy nhất các đoạn nguồn đã chọn đến 9Router qua endpoint
     OpenAI-compatible và yêu cầu structured output cho một lesson draft.
   - Mỗi luận điểm quan trọng trong draft phải có citation trỏ đến đoạn nguồn đã lưu;
     output sai schema hoặc citation không hợp lệ bị từ chối.
   - Draft luôn đi qua Admin review; Admin có thể chỉnh sửa, approve, reject hoặc yêu
     cầu tạo lại. AI không được tự publish.
   - Publish chạy trong một transaction, cập nhật lesson và course visibility cùng
     các dấu vết publication. Course chỉ xuất hiện trong catalog sau khi transaction
     hoàn tất và mọi chapter/lesson bắt buộc đã publish.

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
| Tạo bài tập AI | - | Sinh bài tập + Hàng chờ duyệt | Tự động xuất bản bài tập AI |
| Document-to-Lesson | - | Upload riêng tư → extraction → draft có citation → Admin review → transactional publish | AI tự publish, OCR hoặc RAG đa tài liệu |
| Phân quyền | RLS + Session + Service checks | Quản lý User + Audit Log | Quản lý permission matrix phức tạp |
