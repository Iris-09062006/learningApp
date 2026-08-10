import { expect, test } from "@playwright/test";

import {
  E2E_PASSWORD,
  enrollInSeedCourse,
  expectNoSeriousA11yViolations,
  expectVisibleKeyboardFocus,
  focusWithTab,
  loginAs,
  resetE2eData,
} from "./support/fixtures";

test.beforeEach(async ({ page }) => {
  await resetE2eData(page);
});

test("registers, logs in, and reaches the learner dashboard", async ({ page }) => {
  const email = "new-learner@example.com";

  await page.goto("/register");
  await expectNoSeriousA11yViolations(page);

  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Về trang chủ Python Learning" })).toBeFocused();
  await expectVisibleKeyboardFocus(page);
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Tên hiển thị")).toBeFocused();
  await page.keyboard.type("New E2E Learner");
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Email")).toBeFocused();
  await page.keyboard.type(email);
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Mật khẩu")).toBeFocused();
  await page.keyboard.type(E2E_PASSWORD);
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Tạo tài khoản" })).toBeFocused();
  await expectVisibleKeyboardFocus(page);
  await page.keyboard.press("Enter");

  await expect(page).toHaveURL(/\/login\?registered=1$/u);
  await expect(page.getByRole("status")).toContainText("Tài khoản đã được tạo");

  await focusWithTab(page, page.getByLabel("Email"));
  await page.keyboard.type(email);
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Mật khẩu")).toBeFocused();
  await page.keyboard.type(E2E_PASSWORD);
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Quên mật khẩu?" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Đăng nhập" })).toBeFocused();
  await expectVisibleKeyboardFocus(page);
  await page.keyboard.press("Enter");

  await expect(page).toHaveURL(/\/dashboard$/u);
  await expect(
    page.getByRole("heading", { name: /Chào mừng trở lại, New E2E Learner/u }),
  ).toBeVisible();
  await expectNoSeriousA11yViolations(page);
});

test("enrolls, completes the first lesson exercise, and unlocks the next lesson", async ({ page }) => {
  await loginAs(page);
  await enrollInSeedCourse(page);

  await expect(page.getByTestId("lesson-101-status")).toHaveAttribute("data-status", "unlocked");
  await expect(page.getByTestId("lesson-102-status")).toHaveAttribute("data-status", "locked");
  await expectNoSeriousA11yViolations(page);

  await page.getByRole("link", { name: "Học tiếp" }).click();
  await expect(page).toHaveURL(/\/lessons\/101$/u);
  await expect(page.getByRole("heading", { name: "Biến và phép gán" })).toBeVisible();
  await page.getByRole("link", { name: "Làm bài" }).click();

  await expect(page).toHaveURL(/\/exercises\/1001$/u);
  await page.getByRole("button", { name: "5" }).click();
  await page.getByRole("button", { name: "Nộp bài" }).click();
  await expect(page.getByRole("status")).toContainText("Chính xác!");

  await page.goto("/courses/1/roadmap");
  await expect(page.getByTestId("lesson-101-status")).toHaveAttribute("data-status", "completed");
  await expect(page.getByTestId("lesson-102-status")).toHaveAttribute("data-status", "unlocked");
  await expectNoSeriousA11yViolations(page);
});

test("shows mock AI loading and explanation after a wrong submission", async ({ page }) => {
  await loginAs(page);
  await enrollInSeedCourse(page);
  await page.getByRole("link", { name: "Học tiếp" }).click();
  await page.getByRole("link", { name: "Làm bài" }).click();

  await page.getByRole("button", { name: "4" }).click();
  await page.getByRole("button", { name: "Nộp bài" }).click();
  await expect(page.getByRole("status")).toContainText("Chưa chính xác");

  await page.getByRole("button", { name: /Hỏi AI Mentor giải thích/u }).click();
  await expect(page.getByText("AI Mentor đang suy nghĩ...")).toBeVisible();
  await expect(page.getByText("Giải thích từ AI Mentor")).toBeVisible();
  await expect(page.getByText("Nội dung do AI tạo — có thể chứa sai sót.")).toBeVisible();
  await expectNoSeriousA11yViolations(page);
});

test("provides role-route smoke coverage for moderator and admin", async ({ browser }) => {
  const moderatorContext = await browser.newContext();
  const moderatorPage = await moderatorContext.newPage();
  await resetE2eData(moderatorPage);
  await loginAs(moderatorPage, "moderator");
  await moderatorPage.goto("/moderation");
  await expect(
    moderatorPage.getByRole("heading", { name: "Hàng đợi kiểm duyệt bài tập" }),
  ).toBeVisible();
  await expectNoSeriousA11yViolations(moderatorPage);
  await moderatorContext.close();

  const adminContext = await browser.newContext();
  const adminPage = await adminContext.newPage();
  await loginAs(adminPage, "admin");
  await adminPage.goto("/admin/users");
  await expect(adminPage.getByRole("heading", { name: "Quản lý người dùng" })).toBeVisible();
  await expectNoSeriousA11yViolations(adminPage);
  await adminContext.close();
});

test("creates, reviews, and publishes a lesson draft with learner destination links", async ({ page }) => {
  let draftGenerated = false;
  let draftStatus: "pending_review" | "approved" | "published" = "pending_review";
  const draft = () => ({
    id: 71,
    sourceDocumentId: 9,
    courseId: 31,
    chapterId: 41,
    targetLessonId: 51,
    title: "Nội suy Lagrange",
    summary: "Bài học được tạo từ tài liệu nguồn.",
    estimatedMinutes: 12,
    sections: [{ heading: "Mở đầu", bodyMarkdown: "Nội dung bài học", citationChunkIndexes: [0] }],
    status: draftStatus,
    revision: 1,
    approvedRevision: draftStatus === "pending_review" ? null : 1,
    provider: "9router",
    model: "e2e-model",
    publishedAt: draftStatus === "published" ? "2026-08-10T01:00:00.000Z" : null,
    createdAt: "2026-08-10T00:00:00.000Z",
    updatedAt: "2026-08-10T00:00:00.000Z",
    citations: [{ sectionIndex: 0, chunkIndex: 0, quote: "Nguồn kiểm thử" }],
  });

  await page.route("**/api/admin/**", async (route) => {
    const request = route.request();
    const pathname = new URL(request.url()).pathname;
    const respond = (data: unknown, status = 200) => route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify({ success: true, data }),
    });

    if (pathname === "/api/admin/content-targets") return respond({ items: [], chapters: [], courses: [] });
    if (pathname === "/api/admin/lesson-drafts") return respond({ items: draftGenerated ? [draft()] : [] });
    if (pathname === "/api/admin/content-sources") return respond({ id: 9 }, 201);
    if (pathname === "/api/admin/content-sources/9/extract") return respond({ status: "extracted" });
    if (pathname === "/api/admin/content-curriculum") return respond({ courseId: 31, chapterId: 41, lessonId: 51 }, 201);
    if (pathname === "/api/admin/content-sources/9/generate") {
      draftGenerated = true;
      return respond({ lessonDraftId: 71, status: "pending_review" });
    }
    if (pathname === "/api/admin/lesson-drafts/71/reviews") {
      draftStatus = "approved";
      return respond({ status: "approved" });
    }
    if (pathname === "/api/admin/lesson-drafts/71/publish") {
      draftStatus = "published";
      return respond({
        lessonDraftId: 71,
        lessonId: 51,
        courseId: 31,
        status: "published",
        coursePublished: true,
        publishedAt: "2026-08-10T01:00:00.000Z",
      });
    }
    if (pathname === "/api/admin/lesson-drafts/71") return respond(draft());
    return route.fallback();
  });

  await loginAs(page, "admin");
  await page.goto("/admin/content");
  await expect(page.getByRole("link", { name: "Duyệt bài tập" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Tạo & duyệt bài học" })).toBeVisible();

  await page.getByLabel("Tài liệu nguồn").setInputFiles({
    name: "lagrange.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("Nội suy Lagrange"),
  });
  await page.getByLabel("Tên course mới").fill("Phương pháp tính");
  await page.getByRole("button", { name: "Upload & tạo draft" }).click();

  await expect(page.getByLabel("Tiêu đề", { exact: true })).toHaveValue("Nội suy Lagrange");
  await page.getByRole("button", { name: "Duyệt", exact: true }).click();
  const publishButton = page.getByRole("button", { name: "Xuất bản bài học (transaction)" });
  await expect(publishButton).toBeEnabled();
  await publishButton.click();

  await expect(page.getByText("Bài học đã hiển thị cho người học.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Mở khóa học" })).toHaveAttribute("href", "/courses/31");
  await expect(page.getByRole("link", { name: "Mở lộ trình" })).toHaveAttribute("href", "/courses/31/roadmap");
  await expect(page.getByRole("link", { name: "Mở bài học" })).toHaveAttribute("href", "/lessons/51");
  await expectNoSeriousA11yViolations(page);
});
