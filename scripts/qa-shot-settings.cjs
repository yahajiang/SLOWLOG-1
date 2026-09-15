// 设置页布局改版 · 双视口截图验证
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
  const jar = {};
  const r1 = await fetch(`${BASE}/api/auth/csrf`);
  eat(jar, r1);
  const { csrfToken } = await r1.json();
  const body = new URLSearchParams({ csrfToken, email: "test-admin@test.local", password: "TestAdmin123", callbackUrl: `${BASE}/` });
  const r2 = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", cookie: cookieOf(jar) },
    body, redirect: "manual",
  });
  eat(jar, r2);
  const sessionKey = Object.keys(jar).find((k) => k.includes("session-token"));
  if (!sessionKey) throw new Error("登录失败");

  const browser = await chromium.launch({ channel: "msedge", headless: true });
  for (const [tag, width] of [["desktop", 1440], ["narrow", 480]]) {
    const ctx = await browser.newContext({ viewport: { width, height: 1000 } });
    await ctx.addCookies([{ name: sessionKey, value: jar[sessionKey], url: BASE }]);
    const page = await ctx.newPage();
    await page.goto(`${BASE}/dashboard/settings`, { waitUntil: "networkidle" });
    // 欢迎幕（根 layout 全站过场）自动离场后再截，避免遮挡内容
    await page.waitForTimeout(4500);
    await page.screenshot({ path: `scripts/qa-screens/settings-${tag}.png`, fullPage: true });
    console.log(`✓ settings-${tag}.png (${width}px)`);
    await ctx.close();
  }
  await browser.close();
})().catch((e) => { console.error("FAIL:", e.message); process.exit(1); });
