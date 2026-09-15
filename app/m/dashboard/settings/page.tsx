"use client"
import { useLang } from "@/lib/lang-context";
import { SettingsForm } from "@/components/dashboard/SettingsForm";

/** 移动后台 · 站点设置：与桌面同表单本体（SettingsForm），单列版式自动回退 */
export default function MobileSettingsPage() {
  const { t } = useLang();
  return (
    <div className="section-in">
      <h1 className="text-lg font-semibold tracking-tight text-[var(--dash-text)] mb-4">{t.dashSettings}</h1>
      <SettingsForm />
    </div>
  );
}
