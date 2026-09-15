// 后台板块切换动画 · 实机验证
// 用法：NODE_PATH=<workspace>/node_modules node scripts/qa-verify-stagger.cjs
// 断言：统计卡/列表行挂上 stagger 动画且延迟递增；截图存 qa-screens（gitignored）
const { chromium } = require("playwright");

const BASE = "http://localhost:3000";

function eat(jar, res) {
  for (const c of res.headers.getSetCookie?.() || []) {
    const [pair] = c.split(";");
    const i = pair.indexOf("=");
    jar[pair.slice(0, i).trim()] = pair.slice(i + 1);
  }
}
const cookieOf = (jar) => Object.entries(jar).map(([k, v]) => `${k}=${v}`).join("; ");

(async () => {
  // ① API 登录（test-admin 测试账号，绝不使用真实管理员）
  const jar = {};
  const r1 = await fetch(`${BASE}/api/auth/csrf`);
  eat(jar, r1);
  const { csrfToken } = await r1.json();
  const body = new URLSearchParams({ csrfToken, email: "test-admin@test.local", password: "TestAdmin123", callbackUrl: `${BASE}/` });
  const r2 = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", cookie: cookieOf(jar) },
    body,
    redirect: "manual",
  });
  eat(jar, r2);
  const sessionKey = Object.keys(jar).find((k) => k.includes("session-token"));
  if (!sessionKey) throw new Error("test-admin 登录失败");

  // ② 浏览器注入会话
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addCookies([{ name: sessionKey, value: jar[sessionKey], url: BASE }]);
  const page = await ctx.newPage();

  // ③ 仪表盘：统计卡 stagger
  await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1400); // 等入场动画播完再截图
  const stat = await page.evaluate(() => {
    const grid = document.querySelector(".grid.stagger");
    if (!grid) return null;
    const c = grid.children;
    const cs = (el) => getComputedStyle(el);
    return {
      cards: c.length,
      name: cs(c[0]).animationName,
      dur: cs(c[0]).animationDuration,
      d1: cs(c[0]).animationDelay,
      d2: cs(c[1]).animationDelay,
      d7: cs(c[6]).animationDelay,
      opacityEnd: cs(c[c.length - 1]).opacity,
    };
  });
  console.log("仪表盘统计卡:", JSON.stringify(stat));

  // ④ 文章列表：行 stagger
  await page.goto(`${BASE}/dashboard/posts`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1400);
  const rows = await page.evaluate(() => {
    const list = document.querySelector(".stagger");
    if (!list) return null;
    const c = list.children;
    const cs = (el) => getComputedStyle(el);
    return {
      rows: c.length,
      name: cs(c[0]).animationName,
      d1: cs(c[0]).animationDelay,
      d2: cs(c[1]).animationDelay,
      d3: cs(c[2]).animationDelay,
      lastOpacity: cs(c[c.length - 1]).opacity,
    };
  });
  console.log("文章列表:", JSON.stringify(rows));

  await page.screenshot({ path: "scripts/qa-screens/dash-posts-stagger.png" });
  await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1400);
  await page.screenshot({ path: "scripts/qa-screens/dash-home-stagger.png" });

  await browser.close();

  // ⑤ 断言汇总
  const ok =
    stat && stat.name === "sectionIn" && parseFloat(stat.d2) > parseFloat(stat.d1) &&
    rows && rows.name === "sectionIn" && parseFloat(rows.d2) > parseFloat(rows.d1) &&
    stat.opacityEnd === "1" && rows.lastOpacity === "1";
  console.log(ok ? "STAGGER OK" : "STAGGER FAIL");
  process.exit(ok ? 0 : 1);
})().catch((e) => { console.error("FAIL:", e.message); process.exit(1); });
