import { chromium, devices } from "playwright";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "mobile-preview");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    ...devices["iPhone 13"],
    locale: "zh-CN",
    bypassCSP: true,
  });
  await context.route("**/*", (route) => route.continue());
  const page = await context.newPage();
  await page.setExtraHTTPHeaders({ "Cache-Control": "no-cache" });

  await page.goto("http://localhost:3000/m", { waitUntil: "networkidle", timeout: 60000 });
  const href = await page.locator('a[href^="/m/posts/"]').first().getAttribute("href");
  await page.goto(`http://localhost:3000${href}?t=${Date.now()}`, {
    waitUntil: "networkidle",
    timeout: 60000,
  });
  await page.waitForTimeout(800);

  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(500);

  await page.locator('button[aria-label="TOC"]').click();
  await page.waitForTimeout(600);

  const info = await page.evaluate(() => {
    const sheets = [...document.querySelectorAll(".fixed.inset-0 .absolute.bottom-0")];
    const sheet = sheets[sheets.length - 1];
    const nav = sheet?.querySelector("div[class*='min-h-0'], div[class*='flex-1']");
    const progressBars = [...document.querySelectorAll("[style*='scaleX']")].map((el) => ({
      cls: el.className,
      style: el.getAttribute("style"),
    }));
    return {
      hasMinH0: !!sheet?.querySelector(".min-h-0"),
      sheetHTML: sheet?.innerHTML?.slice(0, 800),
      progressBars,
      bodyHasOverflow: document.body.style.overflow,
    };
  });
  console.log(JSON.stringify(info, null, 2));

  await page.screenshot({ path: path.join(outDir, "06-toc-bottom.png"), fullPage: false });
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
