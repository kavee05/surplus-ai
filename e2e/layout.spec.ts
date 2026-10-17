import { expect, test, type Page } from "@playwright/test";

const PAGES = ["/", "/app", "/app/radar", "/app/surplus", "/app/needs", "/app/transfers", "/app/impact", "/app/evidence", "/app/settings"];

/** Pairs of visible controls whose boxes overlap (ignoring an element and its own children). */
async function overlaps(page: Page, selector: string) {
  return page.evaluate((sel) => {
    const els = [...document.querySelectorAll<HTMLElement>(sel)].filter((e) => {
      const r = e.getBoundingClientRect();
      const st = getComputedStyle(e);
      return r.width > 0 && r.height > 0 && st.visibility !== "hidden" && st.display !== "none";
    });
    const fixed = (e: HTMLElement) => {
      for (let n: HTMLElement | null = e; n; n = n.parentElement) if (getComputedStyle(n).position === "fixed") return true;
      return false;
    };
    const label = (e: HTMLElement) => e.getAttribute("aria-label") || e.textContent?.trim().slice(0, 30) || e.tagName;
    const bad: string[] = [];
    for (let i = 0; i < els.length; i++) {
      for (let j = i + 1; j < els.length; j++) {
        const a = els[i];
        const b = els[j];
        if (a.contains(b) || b.contains(a)) continue;
        // Content scrolls under fixed bars by design; that is checked separately below.
        if (fixed(a) !== fixed(b)) continue;
        const r1 = a.getBoundingClientRect();
        const r2 = b.getBoundingClientRect();
        const w = Math.min(r1.right, r2.right) - Math.max(r1.left, r2.left);
        const h = Math.min(r1.bottom, r2.bottom) - Math.max(r1.top, r2.top);
        if (w > 2 && h > 2) bad.push(`${label(a)} / ${label(b)}`);
      }
    }
    return bad;
  }, selector);
}

for (const path of PAGES) {
  test(`${path}: no horizontal scroll and no overlapping controls`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator("h1")).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, "horizontal overflow in px").toBeLessThanOrEqual(0);
    expect(await overlaps(page, "header a, header button, nav a, nav button, h1, #main button")).toEqual([]);
    // At the end of the page, the last content clears any fixed bottom bar.
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    const clear = await page.evaluate(() => {
      const bar = document.querySelector<HTMLElement>('nav[aria-label="Quick navigation"]');
      const last = document.querySelector<HTMLElement>("#main")?.lastElementChild as HTMLElement | null;
      if (!bar || !last || getComputedStyle(bar).display === "none") return true;
      return last.getBoundingClientRect().bottom <= bar.getBoundingClientRect().top + 1;
    });
    expect(clear, "page end hidden behind the bottom bar").toBe(true);
  });
}
