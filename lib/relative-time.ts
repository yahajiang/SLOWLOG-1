"use client";

import { useEffect, useState } from "react";
import type { Lang } from "./i18n";

/** 站点展示时区固定 +08:00（CST）：SSR（UTC）与客户端同值，防跨零点 hydration mismatch */
const SITE_TZ_OFFSET_MS = 8 * 3600_000;

/** 固定 +08:00 的 MM-DD（归档/标签/卡片行日期） */
export function mdInSiteTz(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const t = Date.parse(dateStr);
  if (isNaN(t)) return "";
  return new Date(t + SITE_TZ_OFFSET_MS).toISOString().slice(5, 10);
}

export function formatDisplayDate(dateStr: string | null, lang: Lang): string {
  if (!dateStr) return ""
  const t = Date.parse(dateStr)
  if (isNaN(t)) return ""
  const d = new Date(t + SITE_TZ_OFFSET_MS)
  return d.toLocaleDateString(lang === "zh" ? "zh-CN" : "en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" })
}

export function formatRelativeTime(dateStr: string, lang: Lang): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 0) return lang === "zh" ? "刚刚" : "just now";

  if (lang === "zh") {
    if (diffSec < 60) return "刚刚";
    if (diffMin < 60) return `${diffMin} 分钟前`;
    if (diffHour < 24) return `${diffHour} 小时前`;
    if (diffDay < 7) return `${diffDay} 天前`;
    if (diffDay < 30) return `${Math.floor(diffDay / 7)} 周前`;
    return new Date(date.getTime() + SITE_TZ_OFFSET_MS).toLocaleDateString("zh-CN", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
  } else {
    if (diffSec < 60) return "just now";
    if (diffMin < 60) return `${diffMin} min ago`;
    if (diffHour < 24) return `${diffHour} hours ago`;
    if (diffDay < 7) return `${diffDay} days ago`;
    if (diffDay < 30) return `${Math.floor(diffDay / 7)} weeks ago`;
    return new Date(date.getTime() + SITE_TZ_OFFSET_MS).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
  }
}

export function useRelativeTime(dateStr: string, lang: Lang): string {
  const [text, setText] = useState(() => formatRelativeTime(dateStr, lang));

  useEffect(() => {
    setText(formatRelativeTime(dateStr, lang));
    const timer = setInterval(() => {
      setText(formatRelativeTime(dateStr, lang));
    }, 60_000); // update every minute
    return () => clearInterval(timer);
  }, [dateStr, lang]);

  return text;
}
