"use client"
import { useLang } from "@/lib/lang-context"
import { SettingsForm } from "@/components/dashboard/SettingsForm"

export default function SettingsPage(){
  const { t } = useLang()
  return (
    <div className="max-w-4xl section-in">
      <h1 className="text-xl font-semibold tracking-tight text-[var(--dash-text)] mb-6" style={{ fontFamily: "Plus Jakarta Sans, system-ui, sans-serif" }}>{t.dashSettings}</h1>
      <SettingsForm />
    </div>
  )
}
