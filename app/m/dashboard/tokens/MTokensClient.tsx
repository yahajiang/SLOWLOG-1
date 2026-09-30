"use client";

import { TokenManager } from "@/components/dashboard/TokenManager";
import { useLang } from "@/lib/lang-context";

/**
 * 移动端 App 令牌页。
 *
 * 复用桌面端同一个 `TokenManager`（含撤销的二次确认与设备表），不复制第二份逻辑 ——
 * 它的两张表本来就各自包在 `overflow-x-auto` 里，窄屏走横向滚动，不丢列。
 * 这里只换页头文案：手机上"明文只显示一次"这句更要紧，因为小屏截屏/复制更方便，
 * 错过就再也拿不到。
 * ⚠️ 页头走字典，`TokenManager` 内部仍是中文（桌面后台既定口径「后台保持中文」）——
 * 这一页因此是半双语，接缝在复用组件那一侧，不在本页。
 */
export default function MobileTokensPage() {
  const { t } = useLang();
  return (
    <div className="space-y-4 section-in">
      <header>
        <h1 className="text-xl font-semibold tracking-tight text-[var(--dash-text)]">{t.dashAppTokens}</h1>
        <p className="mt-1 text-sm leading-relaxed text-[var(--dash-muted)]">{t.dashTokensHint}</p>
        <p className="mt-1 text-sm leading-relaxed text-[var(--dash-muted)]">{t.dashTokensOnceWarn}</p>
      </header>
      <TokenManager />
    </div>
  );
}
