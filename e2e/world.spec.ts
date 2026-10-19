import { expect, test } from "@playwright/test";

const world = (page: import("@playwright/test").Page) => page.locator("[data-demo=surplus-world]");

test.describe("Surplus World", () => {
  test("starts on the light view when reduced motion is on, and every object opens its card", async ({ page }) => {
    await page.goto("/app");
    const w = world(page);
    await expect(w.getByRole("heading", { name: "Surplus World" })).toBeVisible();
    await expect(w.getByRole("button", { name: "2D" })).toHaveAttribute("aria-pressed", "true");
    await expect(w.getByText("Reduced motion is on")).toBeVisible();

    // A site opens its card, with its yard listed.
    await w.getByRole("button", { name: "City of Elmina", exact: true }).click();
    await expect(w.getByText("In its yard")).toBeVisible();
    await expect(w.getByRole("link", { name: "See its leftovers" })).toHaveAttribute("href", /\/app\/surplus\?q=City%20of%20Elmina/);

    // The landfill shows what reuse saved.
    await w.getByRole("button", { name: /Landfill/ }).first().click();
    await expect(w.getByText("Kept out of landfill", { exact: true })).toBeVisible();

    // Close returns to the overview of the world.
    await w.getByRole("button", { name: "Close details" }).click();
    await expect(w.getByText("Click anything in the world")).toBeVisible();
  });

  test("a lorry opens its transfer, and the link goes to the record", async ({ page }) => {
    await page.goto("/app");
    const w = world(page);
    await w.getByRole("button", { name: /^Lorry: / }).first().click();
    const link = w.getByRole("link", { name: "Open transfer" });
    await expect(link).toHaveAttribute("href", /\/app\/transfers\?transfer=/);
    await link.click();
    await expect(page).toHaveURL(/\/app\/transfers\?transfer=/);
  });

  test("works with the keyboard", async ({ page, isMobile }) => {
    test.skip(isMobile, "Keyboard is a desktop concern");
    await page.goto("/app");
    const site = world(page).getByRole("button", { name: "Serenia City", exact: true });
    await site.focus();
    await page.keyboard.press("Enter");
    await expect(site).toHaveAttribute("aria-pressed", "true");
    await expect(world(page).getByRole("heading", { name: "Serenia City" })).toBeVisible();
  });

  test("the 3D view loads when chosen, and the choice is remembered", async ({ page }) => {
    await page.goto("/app");
    const webgl = await page.evaluate(() => !!document.createElement("canvas").getContext("webgl"));
    test.skip(!webgl, "No WebGL in this browser");
    await world(page).getByRole("button", { name: "3D" }).click();
    await expect(world(page).locator("canvas")).toBeVisible({ timeout: 20_000 });
    await expect(world(page).getByText("Loading the 3D world")).toBeHidden({ timeout: 20_000 });
    await page.reload();
    await expect(world(page).getByRole("button", { name: "3D" })).toHaveAttribute("aria-pressed", "true");
    await expect(world(page).locator("canvas")).toBeVisible({ timeout: 20_000 });
  });
});
