"use client"
import { useLang } from "@/lib/lang-context"
import { AdminTitle } from "@/components/ui/AdminTitle"
import { SettingsForm } from "@/components/dashboard/SettingsForm"

export default function SettingsPage(){
  const { t } = useLang()
  return (
    <div className="section-in">
      <AdminTitle className="mb-6">{t.dashSettings}</AdminTitle>
      <SettingsForm />
    </div>
  )
}
