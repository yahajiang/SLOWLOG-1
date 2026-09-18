import type { Metadata } from "next"
import Link from "next/link"
import { getSettings } from "@/lib/settings"

export const metadata: Metadata = {
  title: "隐私政策 | 慢日志",
  description: "SlowLog 慢日志隐私政策：数据收集范围与用途说明。",
}

export default async function PrivacyPage() {
  const settings = await getSettings()
  const contact = "admin@slowlog.dev"

  return (
    <main className="w-full max-w-[min(70%,900px)] mx-auto px-6 py-16">
      <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-[var(--yh-muted)]">
        PRIVACY · APP
      </p>
      <h1 className="mt-3 text-3xl font-semibold text-[var(--yh-text)]" style={{ fontFamily: "var(--font-serif-sc), var(--font-serif), serif" }}>
        隐私政策
      </h1>
      <p className="mt-2 text-sm text-[var(--yh-muted)]">
        {settings.siteName} · SlowLog — 最近更新：2026-09-20
      </p>

      <article className="mt-10 space-y-6 text-[17px] leading-[1.9] text-[var(--yh-text)]">
        <section>
          <h2 className="text-xl font-semibold mb-2">我们收集什么</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>推送令牌（FCM Token）</strong>：仅在你于 App 中开启推送或注册设备时收集，用于向你的设备发送新文章通知。可随时在 App 设置或后台「App 令牌 / 设备注销」中移除。
            </li>
            <li>
              <strong>阅读计数</strong>：文章浏览次数使用服务器 IP（取 <code className="text-sm">x-forwarded-for</code> 首段）在 15 分钟窗口内去重，仅用于统计阅读量，不做用户画像或跨站追踪。
            </li>
            <li>
              <strong>管理凭证</strong>：站长账号密码经 bcrypt 哈希存储；App 使用的长期 API Token 仅保存 SHA-256 摘要，明文只在创建时显示一次，可随时撤销。
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">我们不收集什么</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>无广告 SDK。</li>
            <li>无第三方分析/追踪脚本（站点自有访问量统计除外）。</li>
            <li>不出售、不共享个人数据给广告商。</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">Token 撤销</h2>
          <p>
            站长可登录后台进入「App 令牌」页面撤销任意 API Token。撤销后该 Token 的写操作立即失效。设备推送令牌可通过卸载 App 或调用设备注销接口删除。
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">English Summary</h2>
          <p className="text-[15px] leading-[1.8] text-[var(--yh-muted)]">
            We collect FCM device tokens only to deliver new-post push notifications, and coarse IP-based read counts (15-minute dedupe) for view stats. No ad SDKs, no third-party trackers. Admin API tokens are stored as SHA-256 hashes and can be revoked from the dashboard. Contact: {contact}.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">联系我们</h2>
          <p>
            邮箱：{contact}
            <br />
            仓库 / 站点说明见{" "}
            <Link className="underline" href="/">
              返回首页
            </Link>
          </p>
        </section>
      </article>
    </main>
  )
}
