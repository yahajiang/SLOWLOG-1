import { chromium } from "playwright";

(async () => {
  const b = await chromium.launch({ headless: true });
  const c = await b.newContext({ viewport: { width: 900, height: 700 }, locale: "zh-CN" });
  const p = await c.newPage();
  await p.goto("http://127.0.0.1:3001/m", { waitUntil: "networkidle", timeout: 90000 });
  await p.waitForTimeout(1000);

  const info = await p.evaluate(() => {
    const covers = [...document.querySelectorAll('[class*="art-Engineering"]')];
    return covers.map((el) => {
      const texts = [...el.querySelectorAll("*")]
        .map((n) => (n.childElementCount === 0 ? (n.textContent || "").trim() : ""))
        .filter(Boolean);
      return {
        cls: el.className.slice(0, 80),
        texts,
        htmlSnippet: el.innerHTML
          .replace(/\s+/g, " ")
          .slice(0, 1200),
      };
    });
  });
  console.log(JSON.stringify(info, null, 2));
  await b.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
