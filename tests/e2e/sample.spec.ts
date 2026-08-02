import { expect, test } from "@playwright/test";

test("renders the home page", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: "Nền tảng đã sẵn sàng để xây dựng.",
    }),
  ).toBeVisible();
});
