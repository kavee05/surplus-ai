import { expect, test } from "@playwright/test";

const KEY = "surplus-ai:state";

const BROKEN: [string, string][] = [
  ["corrupt JSON", '{"version":2,"transfers":"broken"'],
  ["a newer version", JSON.stringify({ version: 99 })],
  ["missing records", JSON.stringify({ version: 2, role: "procurement" })],
];

for (const [name, value] of BROKEN) {
  test(`recovers from ${name} in saved demo data`, async ({ page }) => {
    await page.goto("/app");
    await expect(page.locator("h1")).toBeVisible();
    await page.evaluate(([k, v]) => localStorage.setItem(k, v), [KEY, value]);
    await page.reload();
    await expect(page.locator("h1")).toHaveText(/decisions/);
    await expect(page.getByRole("status").filter({ hasText: "Demo data was reset" })).toBeVisible();
    const saved = await page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? "{}"), KEY);
    expect(saved.version).toBe(2);
    expect(Array.isArray(saved.transfers)).toBe(true);
  });
}

test("Reset demo data from the user menu restores the seed", async ({ page }) => {
  await page.goto("/app");
  await expect(page.locator("h1")).toBeVisible();
  await page.evaluate((k) => {
    const s = JSON.parse(localStorage.getItem(k) ?? "{}");
    localStorage.setItem(k, JSON.stringify({ ...s, today: "2026-11-23" }));
  }, KEY);
  await page.reload();
  await expect(page.locator("header")).toContainText("23 Nov 2026");
  await page.getByRole("button", { name: /user menu/ }).click();
  await page.getByRole("menuitem", { name: "Reset demo data" }).click();
  await expect(page.locator("header")).toContainText("2 Nov 2026");
});
