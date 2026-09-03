"use client";

import { LangProvider } from "@/lib/lang-context";
import { ToastProvider } from "@/components/ui/Toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LangProvider>
      <ToastProvider>
        <div className="relative z-[2] flex-1 flex flex-col">{children}</div>
      </ToastProvider>
    </LangProvider>
  );
}
