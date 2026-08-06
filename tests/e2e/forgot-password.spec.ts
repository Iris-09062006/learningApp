import { expect, test } from "@playwright/test";

test.describe("Forgot password flow", () => {
  test("guest can open the forgot-password page", async ({ page }) => {
    await page.goto("/forgot-password");

    await expect(
      page.getByRole("heading", { name: "Quên mật khẩu" }),
    ).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Gửi liên kết đặt lại" }),
    ).toBeVisible();
  });

  test("shows a validation error for an invalid email without submitting", async ({
    page,
  }) => {
    await page.goto("/forgot-password");

    await page.getByLabel("Email").fill("not-an-email");
    await page.getByRole("button", { name: "Gửi liên kết đặt lại" }).click();

    await expect(
      page.getByText("Vui lòng nhập địa chỉ email hợp lệ."),
    ).toBeVisible();
  });

  test("login page links to the forgot-password page", async ({ page }) => {
    await page.goto("/login");

    const forgotPasswordLink = page.getByRole("link", {
      name: "Quên mật khẩu?",
    });
    await expect(forgotPasswordLink).toBeVisible();
    await forgotPasswordLink.click();

    await expect(page).toHaveURL(/\/forgot-password$/);
    await expect(
      page.getByRole("heading", { name: "Quên mật khẩu" }),
    ).toBeVisible();
  });
});