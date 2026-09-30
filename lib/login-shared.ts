/**
 * 登录的两条共享约定，Web 表单与 App 取号共用一份实现。
 *
 * ## 为什么放这儿
 * `normalizeLoginEmail` 原先住在 `lib/auth.ts`，但那个文件静态引 NextAuth 服务端配置、
 * 动态 import prisma/pg —— 客户端组件引它会立刻把 Node 依赖拉进浏览器包。
 * 而登录表单本来就得做同一件「用户名补全域名」的事，于是桌面表单自己又写了一遍，
 * 服务端再写一遍：三处迟早分叉（补全规则一改，App 就登不上）。
 * 本模块零依赖，客户端与服务端都能安全 import。
 */

/** 小写 + 去空白；不含 `@` 的输入补成 `用户名@slowlog.dev` */
export function normalizeLoginEmail(email: string): string {
  const mail = (email || "").toLowerCase().trim();
  if (!mail) return "";
  return mail.includes("@") ? mail : `${mail}@slowlog.dev`;
}

export type LoginOutcome = "ok" | "invalid" | "network";

/**
 * 提交凭据登录。成功时**整页导航**到 `redirectTo` 并返回 "ok"；失败返回原因，
 * 由调用方决定文案。
 *
 * 两个"为什么"都是实测出来的坑：
 * 1. `signIn(…, { redirect: false })` 在取不到 providers 时会改写 location 并
 *    **返回 undefined**（库里写着 TODO）。只判 `res?.error` 会把这种失败当成成功，
 *    于是被中间件弹回登录页，用户看到"点了没反应"。
 * 2. 成功不能用 `router.push`：后台首屏是多个 DB 查询串起来的 RSC 渲染
 *    （凭据那一枪冷连接实测 6.9s 级），push 期间按钮一直停在「登录中…」，
 *    既没有浏览器进度也不可取消，只能靠手动刷新进去。`location.assign`
 *    把等待交还给浏览器（有进度条、可中断）。
 */
export async function submitCredentialLogin(
  usernameOrEmail: string,
  password: string,
  redirectTo: string
): Promise<LoginOutcome> {
  try {
    const { signIn } = await import("next-auth/react");
    const res = await signIn("credentials", {
      email: normalizeLoginEmail(usernameOrEmail),
      password,
      redirect: false,
    });
    if (!res || res.error || res.ok === false) return "invalid";
    window.location.assign(redirectTo);
    return "ok";
  } catch {
    return "network";
  }
}
