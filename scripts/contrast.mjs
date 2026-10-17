// Contrast of every text token against the surfaces it is used on (WCAG 2.x ratio).
// Usage: node scripts/contrast.mjs
import fs from "node:fs";

const css = fs.readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8");
const root = css.slice(css.indexOf(":root {"), css.indexOf("}", css.indexOf(":root {")));
const vars = Object.fromEntries([...root.matchAll(/--([\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
const resolve = (v) => {
  let x = vars[v];
  for (let i = 0; i < 5 && x?.startsWith("var("); i++) x = vars[x.slice(6, -1)];
  return x;
};
const lum = (hex) => {
  const n = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};

const surfaces = ["background", "card", "muted"];
const texts = ["foreground", "muted-foreground", "brand", "forecast-ink", "success", "danger", "warning", "info"];
const pairs = [
  ...texts.flatMap((t) => surfaces.map((s) => [t, s])),
  ["success", "success-soft"], ["danger", "danger-soft"], ["warning", "warning-soft"], ["info", "info-soft"], ["forecast-ink", "forecast-soft"], ["brand-strong", "brand-soft"],
  ["primary-foreground", "primary"], ["sidebar-foreground", "sidebar"],
];
let fail = 0;
for (const [t, s] of pairs) {
  const a = resolve(t);
  const b = resolve(s);
  if (!a?.startsWith("#") || !b?.startsWith("#")) { console.log(`skip ${t} on ${s} (${a} / ${b})`); continue; }
  const r = ratio(a, b);
  const ok = r >= 4.5;
  if (!ok) fail++;
  console.log(`${ok ? "PASS" : "FAIL"} ${r.toFixed(2).padStart(5)}  ${t} (${a}) on ${s} (${b})`);
}
process.exitCode = fail ? 1 : 0;
