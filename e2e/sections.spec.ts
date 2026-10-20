import { expect, test } from "@playwright/test";

test("folded sections show their title, open on click and remember it", async ({ page }) => {
  await page.goto("/app");
  const coming = page.getByRole("button", { name: /Surplus on the way/ });
  await expect(coming).toHaveAttribute("aria-expanded", "false");
  await coming.click();
  await expect(coming).toHaveAttribute("aria-expanded", "true");
  await page.reload();
  await expect(page.getByRole("button", { name: /Surplus on the way/ })).toHaveAttribute("aria-expanded", "true");
});

test("a link to a forecast opens the folded timeline section", async ({ page }) => {
  await page.goto("/app/radar?forecast=fc-elm-p3-tile");
  // The link also opens the forecast's detail panel; close it to see the page.
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: /Phases and forecast surplus/ })).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator('[data-demo="radar-timeline"]')).toBeVisible();
});

test("How this page works opens to explain the page", async ({ page }) => {
  await page.goto("/app/transfers");
  await page.getByRole("button", { name: /How this page works/ }).click();
  await expect(page.getByText("Structural items such as steel and concrete need a site engineer's approval")).toBeVisible();
});
