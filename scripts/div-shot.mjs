import { chromium } from "playwright";

const OUT = "C:/Users/Yahajiang/Desktop/AstrBot插件/慢日志/mobile-preview/10-cover-div.png";

(async () => {
  const b = await chromium.launch({ headless: true });
  const c = await b.newContext({ viewport: { width: 1400, height: 1000 }, locale: "zh-CN" });
  const p = await c.newPage();
  await p.goto("http://127.0.0.1:3004/", { waitUntil: "networkidle", timeout: 90000 });
  await p.waitForTimeout(2000);
  const grid = p.locator("#posts").first();
  await grid.scrollIntoViewIfNeeded();
  await p.waitForTimeout(800);
  await grid.screenshot({ path: OUT });
  console.log("saved", OUT);
  await b.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
