import { expect, test } from "@playwright/test";

test.describe("phone", () => {
  test.skip(({ isMobile }) => !isMobile, "Phone only");

  test("bottom navigation reaches each screen", async ({ page }) => {
    await page.goto("/app");
    const nav = page.getByRole("navigation", { name: "Quick navigation" });
    await expect(nav).toBeVisible();
    await nav.getByRole("link", { name: "Radar" }).click();
    await expect(page).toHaveURL(/\/app\/radar/);
    await nav.getByRole("link", { name: "Log surplus" }).click();
    await expect(page).toHaveURL(/\/app\/surplus\/log/);
    await nav.getByRole("link", { name: "Transfers" }).click();
    await expect(page).toHaveURL(/\/app\/transfers/);
    await nav.getByRole("button", { name: "More" }).click();
    await expect(page.getByRole("link", { name: "Evidence" })).toBeVisible();
  });
});

test("command palette opens with the keyboard and navigates", async ({ page, isMobile }) => {
  test.skip(isMobile, "Keyboard shortcut is a desktop feature");
  await page.goto("/app");
  await expect(page.locator("h1")).toBeVisible();
  await page.keyboard.press("Control+k");
  const input = page.getByPlaceholder("Go to a page or run an action");
  await expect(input).toBeVisible();
  await input.fill("Impact");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/app\/impact/);
});
