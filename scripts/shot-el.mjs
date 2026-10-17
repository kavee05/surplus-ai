// Screenshot one element: node scripts/shot-el.mjs <path> <selector> <width> <out>
import { chromium } from "@playwright/test";
const [rawPath, sel, w = "1280", out] = process.argv.slice(2);
const path = rawPath === "home" ? "/" : rawPath;
const b = await chromium.launch({ channel: "chrome" });
const p = await b.newPage({ viewport: { width: +w, height: 900 }, reducedMotion: "reduce" });
await p.goto((process.env.BASE_URL ?? "http://localhost:3001") + path, { waitUntil: "networkidle", timeout: 120000 });
await p.locator(sel).first().screenshot({ path: out });
await b.close();
