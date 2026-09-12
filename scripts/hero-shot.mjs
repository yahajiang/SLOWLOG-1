import { chromium } from "playwright";

const OUT = "C:/Users/Yahajiang/Desktop/AstrBot插件/慢日志/mobile-preview/08-hero-cover.png";

(async () => {
  const b = await chromium.launch({ headless: true });
  const c = await b.newContext({ viewport: { width: 1280, height: 800 }, locale: "zh-CN" });
  const p = await c.newPage();
  await p.goto("http://127.0.0.1:3002/", { waitUntil: "networkidle", timeout: 90000 });
  await p.waitForTimeout(1500);

  const hero = p.locator("section").filter({ hasText: /推荐|Featured|阅读文章/ }).first();
  if (!(await hero.count())) throw new Error("no hero");
  await hero.screenshot({ path: OUT });
  console.log("saved", OUT);

  // 确认用的是 HeroCover（无 TagScene svg 的大主体）
  const hasHero = await p.locator('[class*="art-"]').count();
  console.log("art nodes", hasHero);
  await b.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
