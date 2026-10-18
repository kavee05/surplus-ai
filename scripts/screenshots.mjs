// Captures key screens at 375, 768 and 1280 px from a running local build.
// Usage: node scripts/screenshots.mjs <outDir> [route-names...]
import { chromium } from "@playwright/test";
import fs from "node:fs";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const ROUTES = {
  landing: "/",
  overview: "/app",
  radar: "/app/radar",
  inventory: "/app/surplus",
  needs: "/app/needs",
  transfers: "/app/transfers",
  impact: "/app/impact",
  evidence: "/app/evidence",
  settings: "/app/settings",
};
const WIDTHS = [375, 768, 1280];
const [out = "screenshots/after", ...only] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ channel: "chrome" });
for (const w of WIDTHS) {
  const page = await browser.newPage({ viewport: { width: w, height: 900 }, reducedMotion: "reduce" });
  for (const [name, path] of Object.entries(ROUTES)) {
    if (only.length && !only.includes(name)) continue;
    await page.goto(BASE + path, { waitUntil: "networkidle" });
    await page.waitForTimeout(1200);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    await page.screenshot({ path: `${out}/${name}-${w}.png`, fullPage: true });
    console.log(`${name}-${w}${overflow > 0 ? `  OVERFLOW ${overflow}px` : ""}`);
  }
  await page.close();
}
await browser.close();
