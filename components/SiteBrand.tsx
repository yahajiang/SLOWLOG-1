"use client";

import Link from "next/link";
import { useSiteSettings } from "@/lib/settings-context";
import { BrandMark } from "@/components/ui/Panel";

// 内容页顶栏的品牌块（首页 Header 那份带 slogan，结构不同，未并进来）。
// 站名/Logo 由后台「站点设置」下发，无值回退内置品牌；
// 窄容器（70% 书脊）里品牌永不断字，拉丁副名 <md 先让位——编辑气质优先于"全都露出"。
export function SiteBrand({ className = "" }: { className?: string }) {
  const settings = useSiteSettings();
  const siteName = settings.siteName || "慢日志";
  const siteNameEn = settings.siteNameEn || "SLOWLOG";

  return (
    <Link href="/" className={className}>
      {settings.logoUrl ? (
        <img src={settings.logoUrl} alt="" className="w-[26px] h-[26px] rounded-full object-cover shrink-0" />
      ) : (
        <BrandMark />
      )}
      <span className="flex items-baseline gap-1 whitespace-nowrap">
        <span className="font-semibold text-[15px] tracking-tight">{siteName}</span>
        <span className="mono text-[12px] tracking-[0.14em] uppercase hidden md:inline">· {siteNameEn}</span>
      </span>
    </Link>
  );
}
