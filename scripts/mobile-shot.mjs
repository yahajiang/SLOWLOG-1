import { chromium, devices } from "playwright";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "mobile-preview");
fs.mkdirSync(outDir, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true });
  const iPhone = devices["iPhone 13"];
  const context = await browser.newContext({
    ...iPhone,
    locale: "zh-CN",
  });
  const page = await context.newPage();

  async function shot(url, name, opts = {}) {
    await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
    if (opts.waitFor) await page.waitForTimeout(opts.waitFor);
    if (opts.click) {
      await page.locator(opts.click).first().click();
      await page.waitForTimeout(400);
    }
    const file = path.join(outDir, name);
    await page.screenshot({ path: file, fullPage: opts.fullPage !== false });
    console.log("saved", file);
  }

  await shot("http://localhost:3000/m", "01-home.png", { waitFor: 800 });
  await shot("http://localhost:3000/m/archive", "02-archive.png", { waitFor: 500 });

  const href = await page
    .locator('a[href^="/m/posts/"]')
    .first()
    .getAttribute("href")
    .catch(() => null);
  if (href) {
    await shot(`http://localhost:3000${href}`, "03-post.png", { waitFor: 600, fullPage: true });
    await shot(`http://localhost:3000${href}`, "04-toc.png", {
      waitFor: 400,
      fullPage: false,
      click: 'button[aria-label="TOC"]',
    });
  }

  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
