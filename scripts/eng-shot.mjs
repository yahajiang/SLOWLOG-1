import { chromium } from "playwright";

const OUT = "C:/Users/Yahajiang/Desktop/AstrBot插件/慢日志/mobile-preview/07-eng-cover.png";

(async () => {
  const b = await chromium.launch({ headless: true });
  const c = await b.newContext({
    viewport: { width: 900, height: 700 },
    locale: "zh-CN",
    bypassCSP: true,
  });
  const p = await c.newPage();
  await p.goto("http://127.0.0.1:3001/m", { waitUntil: "networkidle", timeout: 90000 });
  await p.waitForTimeout(1200);

  const card = p.locator("a").filter({ hasText: /Tauri|打印助手|print/i }).first();
  if (!(await card.count())) throw new Error("no tauri link");

  await card.scrollIntoViewIfNeeded();
  await p.waitForTimeout(500);

  // 只截封面内部
  const cover = card.locator('[class*="art-Engineering"], [class*="cover"]').first();
  const target = (await cover.count()) ? cover : card;
  await target.screenshot({ path: OUT });
  console.log("saved", OUT);
  await b.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
