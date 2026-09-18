"use client"

import { TokenManager } from "@/components/dashboard/TokenManager"

export default function TokensPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold">App 令牌</h1>
        <p className="mt-1 text-sm text-[var(--yh-muted)]">
          为 Android App 生成长期 API Token（明文只显示一次），并查看推送设备。撤销后写操作立即失效。
        </p>
      </header>
      <TokenManager />
    </div>
  )
}
