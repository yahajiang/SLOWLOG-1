"use client";

import { useEffect, useState } from "react";
import type { Lang } from "./i18n";

export function formatRelativeTime(dateStr: string, lang: Lang): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (lang === "zh") {
    if (diffSec < 60) return "刚刚";
    if (diffMin < 60) return `${diffMin} 分钟前`;
    if (diffHour < 24) return `${diffHour} 小时前`;
    if (diffDay < 7) return `${diffDay} 天前`;
    if (diffDay < 30) return `${Math.floor(diffDay / 7)} 周前`;
    // For older dates, show displayDate
    return date.toLocaleDateString("zh-CN", { month: "short", day: "numeric", year: "numeric" });
  } else {
    if (diffSec < 60) return "just now";
    if (diffMin < 60) return `${diffMin} min ago`;
    if (diffHour < 24) return `${diffHour} hours ago`;
    if (diffDay < 7) return `${diffDay} days ago`;
    if (diffDay < 30) return `${Math.floor(diffDay / 7)} weeks ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
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
