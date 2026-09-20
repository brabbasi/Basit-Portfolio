import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const failures = [];

function fail(message) {
  failures.push(message);
}

for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
  const value = match[1];
  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("#") ||
    value.startsWith("mailto:") ||
    value.startsWith("tel:") ||
    value.startsWith("data:")
  ) continue;
  const clean = value.split(/[?#]/, 1)[0];
  if (!clean) continue;
  if (!fs.existsSync(path.join(root, clean))) fail(`Missing local asset/link: ${value}`);
}

if (html.includes("your-vercel-link.com")) fail("Placeholder Open Graph URL remains.");
if (/<form\b/i.test(html)) fail("A contact form is presented without a verified submit contract.");
if (/id="certifications"/i.test(html)) fail("Unverified certification surface remains.");
if (/id="testimonials"/i.test(html)) fail("Unattributed testimonial surface remains.");
if (!html.includes("&copy; 2026 Basit Raza Abbasi")) fail("Portfolio copyright year is stale.");

for (const tag of html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/gi)) {
  if (!/rel="[^"]*noopener[^"]*"/i.test(tag[0])) fail(`target=_blank link lacks noopener: ${tag[0]}`);
}

if (failures.length) {
  console.error("PORTFOLIO_INTEGRITY_FAIL");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("PORTFOLIO_INTEGRITY_PASS");
