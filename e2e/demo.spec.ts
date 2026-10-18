import { expect, test } from "@playwright/test";

const CREDIT = "Built by Team ALICE, UTM KL. Code by Kaveetiran A/L Sitambaram.";

test.describe("guided demo", () => {
  test.skip(({ isMobile }) => isMobile, "Runs once, on desktop");

  test("runs from the landing page to RM 41,719 on Impact", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Try the guided demo" }).first().click();
    const panel = page.getByRole("dialog", { name: "Guided demo" });
    await expect(panel).toBeVisible();

    const next = async (title: string) => {
      await panel.getByRole("button", { name: /^Next/ }).click();
      await expect(panel.getByRole("heading")).toHaveText(title);
    };
    await expect(panel).toContainText("A buyer is about to order 1,000 tiles");
    await next("Radar spots leftovers before they exist");
    await next("Reserve 800, order only 200");
    const result = page.locator('[data-demo="preorder-result"]');
    await expect(result).toContainText("reserve 800 from forecast surplus, order 200 new");
    await expect(result).toContainText("24 Nov 2026");
    await next("Reserve the expected tiles");
    await next("Three weeks later at City of Elmina");
    await next("The forecast turns Confirmed");
    await next("Collect and complete the transfer");
    await next("Management sees the result");
    await expect(page).toHaveURL(/\/app\/impact/);
    await expect(page.locator('[data-demo="impact-kpis"]')).toContainText("RM 41,719");
    await panel.getByRole("button", { name: "Finish" }).click();
    await expect(panel).toBeHidden();
  });
});

test("landing shows the hero recommendation and the credit", async ({ page }) => {
  await page.goto("/");
  const hero = page.locator("figure").first();
  await expect(hero).toContainText("800");
  await expect(hero).toContainText("200");
  await expect(hero).toContainText("24 Nov");
  await expect(page.locator("#radar")).toContainText("RM 11,098, 6.4 t diverted");
  await expect(page.locator("footer")).toContainText(CREDIT);
  await expect(page.getByText("Simulated data").first()).toBeVisible();
});

test("Radar shows the hero numbers for the default check", async ({ page }) => {
  await page.goto("/app/radar");
  const r = page.locator('[data-demo="preorder-result"]');
  await expect(r).toContainText("reserve 800 from forecast surplus, order 200 new");
  await expect(r).toContainText("24 Nov 2026");
  await expect(r).toContainText("RM 11,098");
  await expect(r).toContainText("6.4 t");
});

for (const path of ["/app", "/app/radar", "/app/surplus", "/app/needs", "/app/transfers", "/app/impact", "/app/evidence", "/app/settings", "/app/activity"]) {
  test(`${path} renders with the credit and demo date`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.getByText(CREDIT)).toBeVisible();
    await expect(page.getByText("Demo date")).toBeVisible();
  });
}

test("Review and hold opens with the recommended quantity filled in", async ({ page }) => {
  await page.goto("/app/radar");
  await page.getByRole("button", { name: /Review and hold 800/ }).click();
  const dialog = page.getByRole("dialog", { name: "Reserve expected leftovers" });
  await expect(dialog.getByLabel("Quantity to hold")).toHaveValue("800");
  await expect(dialog.getByRole("button", { name: "Confirm hold" })).toBeEnabled();
});
