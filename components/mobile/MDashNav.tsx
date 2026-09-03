"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, MessageSquare, MoreHorizontal } from "lucide-react";

const tabs = [
  { href: "/m/dashboard", label: "概览", icon: LayoutDashboard },
  { href: "/m/dashboard/posts", label: "文章", icon: FileText },
  { href: "/m/dashboard/notes", label: "随想", icon: MessageSquare },
  { href: "/m/dashboard/more", label: "更多", icon: MoreHorizontal },
];

/** 移动后台底部 Tab（桌面 Sidebar 的手机版） */
export function MDashNav() {
  const pathname = usePathname();
  return (
    <nav className="sticky bottom-0 z-40 bg-[var(--dash-card)] border-t border-[var(--dash-border)]">
      <div className="grid grid-cols-4">
        {tabs.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/m/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 py-2.5 text-[11px] rounded-none min-h-[56px] justify-center transition-colors ${
                active ? "text-[var(--dash-accent)] font-medium" : "text-[var(--dash-muted)]"
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
