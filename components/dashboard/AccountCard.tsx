"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import { useToast } from "@/components/ui/Toast"
import { useLang } from "@/lib/lang-context"

/** 账号管理卡片：基于 /api/auth/change-password（当前密码复核 + 两次确认 + 邮箱/名称） */
export function AccountCard() {
  const { t, lang } = useLang()
  const { toast } = useToast()
  const router = useRouter()
  const [currentPassword, setCurrentPassword] = useState("")
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (password !== confirmPassword) {
      setError(lang === "zh" ? "两次密码不一致" : "Passwords do not match")
      return
    }
    setSaving(true)
    try {
      const r = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, email, password, name, confirmPassword }),
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) {
        setError(d.error || (lang === "zh" ? "修改失败" : "Update failed"))
        setSaving(false)
        return
      }
      toast(t.acctSaved, "success")
      // 邮箱/密码已变更，会话失效：登出并回到登录页
      await signOut({ redirect: false })
      router.push("/login?changed=1")
    } catch {
      setError(lang === "zh" ? "网络错误" : "Network error")
      setSaving(false)
    }
  }

  const input = "w-full px-3 py-2 text-sm border border-[var(--dash-border)] rounded-none bg-[var(--dash-bg)] focus:bg-[var(--dash-card)] focus:border-[var(--dash-accent)] focus:outline-none"
  const label = "text-xs text-[var(--dash-muted)]"

  return (
    <div className="bg-[var(--dash-card)] border border-[var(--dash-border)] rounded-none p-6 space-y-5 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-2.5">
        <span className="w-5 h-px bg-[var(--dash-accent)]/60" aria-hidden />
        <h2 className="text-sm font-semibold tracking-wide text-[var(--dash-text)]">{t.acctTitle}</h2>
      </div>
      <p className="text-xs text-[var(--dash-muted)] -mt-2">{t.acctDesc}</p>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className={label}>{t.acctCurrent}</label>
          <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className={`mt-1 ${input}`} autoComplete="current-password" />
        </div>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className={label}>{t.acctEmail}</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={`mt-1 ${input}`} placeholder="your@email.com" />
          </div>
          <div>
            <label className={label}>{t.acctName}</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={`mt-1 ${input}`} placeholder={lang === "zh" ? "显示名称" : "Display name"} />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className={label}>{t.acctNewPass}</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={`mt-1 ${input}`} autoComplete="new-password" placeholder={lang === "zh" ? "至少 8 位" : "At least 8 characters"} />
          </div>
          <div>
            <label className={label}>{t.acctConfirm}</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={`mt-1 ${input}`} autoComplete="new-password" placeholder={lang === "zh" ? "再次输入新密码" : "Re-enter new password"} />
          </div>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-none">{error}</div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving || !currentPassword || !email || !password || !confirmPassword || !name}
            className="px-6 py-2 bg-[var(--dash-text)] text-white text-sm rounded-none disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 font-medium"
          >
            {saving ? (lang === "zh" ? "保存中..." : "Saving...") : t.acctSave}
          </button>
        </div>
      </form>
    </div>
  )
}
