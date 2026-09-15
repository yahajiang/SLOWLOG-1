// Functional test: default-password session force-change + write API 403
//
// P3-7：不再内置默认账户的明文凭据。此前 `admin@slowlog.dev / admin123` 直接写死在
// 源码里——既会随默认密码变更而静默失效，也让仓库长期带着一份可被误用的凭据。
// 现改为从环境变量读取：
//   TEST_BASE_URL（可选，默认 http://localhost:3000）
//   TEST_EMAIL   （可选，默认 admin@slowlog.dev）
//   TEST_PASSWORD（必填，无默认值）
const base = process.env.TEST_BASE_URL || 'http://localhost:3000';
const EMAIL = process.env.TEST_EMAIL || 'admin@slowlog.dev';
const PASSWORD = process.env.TEST_PASSWORD;
if (!PASSWORD) {
  console.error('[test-force-password] 请先设置 TEST_PASSWORD 环境变量（默认账户的当前密码）。');
  process.exit(1);
}

async function req(url, opts = {}) {
  const res = await fetch(url, {
    redirect: 'manual',
    ...opts,
    headers: {
      ...(opts.body ? { 'Content-Type': 'application/json' } : {}),
      ...(opts.headers || {}),
    },
  });
  const loc = res.headers.get('location');
  const text = await res.text();
  // collect set-cookie
  const setCookies = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
  return { status: res.status, loc, text, setCookies, headers: res.headers };
}

async function main() {
  // 1. get csrf + cookie
  const csrfRes = await req(base + '/api/auth/csrf');
  const csrf = JSON.parse(csrfRes.text).csrfToken;
  const cookies = {};
  for (const c of csrfRes.setCookies) {
    const [pair] = c.split(';');
    const [k, v] = pair.split('=');
    cookies[k.trim()] = v;
  }
  const cookieHeader = Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; ');

  // 2. login with default password
  const loginRes = await req(base + '/api/auth/callback/credentials', {
    method: 'POST',
    body: JSON.stringify({ email: EMAIL, password: PASSWORD, csrfToken: csrf }),
    headers: { Cookie: cookieHeader },
  });
  for (const c of loginRes.setCookies) {
    const [pair] = c.split(';');
    const [k, v] = pair.split('=');
    cookies[k.trim()] = v;
  }
  const authed = Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; ');
  console.log('login status', loginRes.status, 'loc', loginRes.loc);

  // 3. session
  const ses = await req(base + '/api/auth/session', { headers: { Cookie: authed } });
  console.log('session', ses.text.slice(0, 300));

  // 4. dashboard should force change-password
  const dash = await req(base + '/dashboard', { headers: { Cookie: authed } });
  console.log('GET /dashboard', dash.status, '->', dash.loc);
  const mdash = await req(base + '/m/dashboard', { headers: { Cookie: authed } });
  console.log('GET /m/dashboard', mdash.status, '->', mdash.loc);
  const change = await req(base + '/dashboard/change-password', { headers: { Cookie: authed } });
  console.log('GET /dashboard/change-password', change.status, 'len', change.text.length);

  // 5. write APIs should 403
  const postWrite = await req(base + '/api/posts', {
    method: 'POST',
    body: JSON.stringify({ title: 'x', tags: ['a'], categoryId: 'nope' }),
    headers: { Cookie: authed },
  });
  console.log('POST /api/posts', postWrite.status, postWrite.text.slice(0, 120));

  const settingsWrite = await req(base + '/api/settings', {
    method: 'PUT',
    body: JSON.stringify({ siteName: 'hacked' }),
    headers: { Cookie: authed },
  });
  console.log('PUT /api/settings', settingsWrite.status, settingsWrite.text.slice(0, 120));

  // 6. GET api still allowed
  const postsGet = await req(base + '/api/posts?status=all', { headers: { Cookie: authed } });
  console.log('GET /api/posts?status=all', postsGet.status, 'len', postsGet.text.length);

  const ok =
    ses.text.includes(EMAIL) &&
    (dash.loc || '').includes('change-password') &&
    (mdash.loc || '').includes('change-password') &&
    change.status === 200 &&
    postWrite.status === 403 &&
    settingsWrite.status === 403 &&
    postsGet.status === 200;

  console.log(ok ? 'FORCE-PASSWORD-FLOW PASS' : 'FORCE-PASSWORD-FLOW FAIL');
  process.exit(ok ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
