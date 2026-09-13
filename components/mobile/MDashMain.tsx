"use client";

import { usePathname } from "next/navigation";

/** 移动后台主区：路由切换时 section-in 淡入，与前台分类切换同语感 */
export function MDashMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <main key={pathname} className="flex-1 p-4 pb-8 section-in">
      {children}
    </main>
  );
}
