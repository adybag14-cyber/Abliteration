import { readFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const source = path.resolve("public/og-card.svg");
const destination = path.resolve("public/og-card.png");
const svg = await readFile(source, "utf8");
const browser = await chromium.launch({ headless: true });

try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.setContent(`<style>html,body{margin:0;width:1200px;height:630px;overflow:hidden}svg{display:block}</style>${svg}`, { waitUntil: "load" });
  await page.screenshot({ path: destination, type: "png", animations: "disabled" });
} finally {
  await browser.close();
}

console.log(`Rendered ${destination} at 1200x630`);
