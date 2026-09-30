"use client"
import { useLang } from "@/lib/lang-context";
import { AdminTitle } from "@/components/ui/AdminTitle";
import { SettingsForm } from "@/components/dashboard/SettingsForm";

/** 移动后台 · 站点设置：与桌面同表单本体（SettingsForm），单列版式自动回退 */
export default function MobileSettingsPage() {
  const { t } = useLang();
  return (
    <div className="section-in">
      <AdminTitle className="mb-4">{t.dashSettings}</AdminTitle>
      <SettingsForm />
    </div>
  );
}
