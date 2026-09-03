"use client";

import { useEffect, useState } from "react";
import { LogOut, MonitorSmartphone } from "lucide-react";
import { signOut } from "next-auth/react";
import { useToast } from "@/components/ui/Toast";
import { ListItemSkeleton } from "@/components/dashboard/Skeleton";

/** 移动端更多：分类查看＋媒体查看＋退出＋桌面版切换 */
export default function MobileMorePage() {
  const [cats, setCats] = useState<any[]>([]);
  const [media, setMedia] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    Promise.all([
      fetch("/api/categories").then((r) => r.json()),
      fetch("/api/media").then((r) => r.json()),
    ])
      .then(([c, m]) => {
        setCats(Array.isArray(c) ? c : []);
        setMedia(Array.isArray(m) ? m.slice(0, 9) : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const copyMedia = async (url: string) => {
    await navigator.clipboard.writeText(url);
    toast("已复制链接", "success");
  };

  function goDesktop() {
    document.cookie = "view=desktop; path=/; max-age=31536000";
    window.location.href = "/dashboard";
  }

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold tracking-tight text-[var(--dash-text)]">更多</h1>

      <section className="bg-[var(--dash-card)] border border-[var(--dash-border)] rounded-none overflow-hidden">
        <h2 className="text-sm font-semibold text-[var(--dash-text)] px-4 pt-4 pb-2">分类查看</h2>
        {loading ? (
          <div className="divide-y divide-[var(--dash-border)]">
            <ListItemSkeleton />
            <ListItemSkeleton />
          </div>
        ) : cats.length === 0 ? (
          <p className="p-6 text-center text-sm text-[var(--dash-muted)]">暂无分类</p>
        ) : (
          <div className="divide-y divide-[var(--dash-border)]">
            {cats.map((c) => (
              <div key={c.id} className="flex items-center justify-between px-4 py-3 min-h-[56px]">
                <p className="text-sm font-medium text-[var(--dash-text)]">
                  {c.name} {c.nameZh && <span className="text-[var(--dash-muted)]">/ {c.nameZh}</span>}
                </p>
                <span className="text-xs text-[var(--dash-muted)] tabular-nums">
                  {c._count?.posts ?? 0} 篇
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="bg-[var(--dash-card)] border border-[var(--dash-border)] rounded-none overflow-hidden">
        <h2 className="text-sm font-semibold text-[var(--dash-text)] px-4 pt-4 pb-2">媒体查看（近 9 张）</h2>
        {loading ? (
          <div className="grid grid-cols-3 gap-2 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-square bg-[var(--dash-bg)] animate-pulse" />
            ))}
          </div>
        ) : media.length === 0 ? (
          <p className="p-6 text-center text-sm text-[var(--dash-muted)]">暂无图片</p>
        ) : (
          <div className="grid grid-cols-3 gap-2 p-4">
            {media.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => copyMedia(m.url)}
                className="aspect-square bg-[var(--dash-bg)] border border-[var(--dash-border)] overflow-hidden active:opacity-70"
                title={m.filename}
              >
                <img src={m.url} alt={m.alt || m.filename} loading="lazy" decoding="async" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
        <p className="px-4 pb-3 text-[11px] text-[var(--dash-muted)]">点按图片复制链接 · 完整管理请使用桌面版</p>
      </section>

      <section className="space-y-2.5">
        <button
          type="button"
          onClick={goDesktop}
          className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--dash-card)] border border-[var(--dash-border)] text-sm rounded-none min-h-[48px]"
        >
          <MonitorSmartphone className="w-4 h-4" /> 桌面版后台
        </button>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/m/login" })}
          className="w-full flex items-center justify-center gap-2 py-3 text-sm text-red-600 bg-[var(--dash-card)] border border-red-200 rounded-none min-h-[48px]"
        >
          <LogOut className="w-4 h-4" /> 退出登录
        </button>
      </section>
    </div>
  );
}
