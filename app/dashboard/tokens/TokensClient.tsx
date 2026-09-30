"use client"

import { TokenManager } from "@/components/dashboard/TokenManager"
import { AdminTitle } from "@/components/ui/AdminTitle"
import { useLang } from "@/lib/lang-context"

export default function TokensPage() {
  const { t } = useLang()
  return (
    <div className="space-y-6">
      <header>
        <AdminTitle>{t.dashAppTokens}</AdminTitle>
        <p className="mt-1 text-sm text-[var(--yh-muted)]">
          {t.dashTokensHint}
        </p>
      </header>
      <TokenManager />
    </div>
  )
}
