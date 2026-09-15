// 移动后台设置页验证（登录 + 手机 UA + 截图）
const BASE = "http://localhost:3000";
const { chromium } = require("playwright");
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
  const r2 = await fetch(`${BASE}/api/auth/callback/credentials`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", cookie: cookieOf(jar) }, body, redirect: "manual" });
  eat(jar, r2);
  const sessionKey = Object.keys(jar).find((k) => k.includes("session-token"));

  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  });
  await ctx.addCookies([{ name: sessionKey, value: jar[sessionKey], url: BASE }]);
  const page = await ctx.newPage();
  await page.goto(`${BASE}/m/dashboard/settings`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  const hasForm = await page.evaluate(() => !!document.querySelector("input[value='']") || document.querySelectorAll("input").length > 0);
  const tabs = await page.evaluate(() => document.querySelectorAll("nav a").length);
  console.log(`设置页输入框>0: ${hasForm} | 底部 tab 数: ${tabs}`);
  await page.screenshot({ path: "scripts/qa-screens/m-settings.png", fullPage: true });
  await browser.close();
  console.log(hasForm && tabs === 5 ? "MOBILE SETTINGS OK" : "CHECK FAILED");
})().catch((e) => { console.error("FAIL:", e.message); process.exit(1); });
