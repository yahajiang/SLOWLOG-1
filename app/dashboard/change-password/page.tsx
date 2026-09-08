"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import { useLang } from "@/lib/lang-context"

export default function ChangePasswordPage() {
  const { lang } = useLang()
  const [newEmail, setNewEmail] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [newName, setNewName] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (!newEmail.trim() || !newPassword.trim() || !newName.trim()) {
      setError("请填写所有字段")
      return
    }
    if (newPassword.length < 8) {
      setError(lang === "zh" ? "密码至少 8 位" : "Password must be at least 8 characters")
      return
    }
    if (newPassword !== confirmPassword) {
      setError(lang === "zh" ? "两次密码不一致" : "Passwords do not match")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newEmail.trim(),
          password: newPassword.trim(),
          name: newName.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || (lang === "zh" ? "修改失败" : "Update failed"))
        setLoading(false)
        return
      }
      // 改密成功，重新登录以刷新 JWT（清除 needsPasswordChange 标志）
      await signOut({ redirect: false })
      router.push("/login?changed=1")
    } catch {
      setError("网络错误")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--dash-bg)] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-[var(--dash-text)] mb-2">{lang === "zh" ? "修改默认账户" : "Update Default Account"}</h1>
          <p className="text-sm text-[var(--dash-muted)]">
            {lang === "zh" ? "检测到您使用的是默认账户，请修改邮箱、密码和名称后继续使用。" : "You are using the default account. Please update your email, password and name to continue."}
          </p>
        </div>

        <div className="bg-[var(--dash-card)] border border-[var(--dash-border)] p-8 rounded-none">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-[11px] tracking-widest uppercase text-[var(--dash-muted)] font-medium block mb-2">
                新邮箱
              </label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full px-4 py-3 text-sm border border-[var(--dash-border)] bg-[var(--dash-bg)] focus:bg-[var(--dash-card)] focus:border-[var(--dash-accent)] focus:outline-none transition-colors rounded-none"
                placeholder="your@email.com"
                autoFocus
              />
            </div>

            <div>
              <label className="text-[11px] tracking-widest uppercase text-[var(--dash-muted)] font-medium block mb-2">
                {lang === "zh" ? "新密码" : "New Password"}
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 text-sm border border-[var(--dash-border)] bg-[var(--dash-bg)] focus:bg-[var(--dash-card)] focus:border-[var(--dash-accent)] focus:outline-none transition-colors rounded-none"
                placeholder={(lang === "zh" ? "至少 8 位" : "At least 8 characters")}
              />
            </div>

            <div>
              <label className="text-[11px] tracking-widest uppercase text-[var(--dash-muted)] font-medium block mb-2">
                {lang === "zh" ? "确认密码" : "Confirm Password"}
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 text-sm border border-[var(--dash-border)] bg-[var(--dash-bg)] focus:bg-[var(--dash-card)] focus:border-[var(--dash-accent)] focus:outline-none transition-colors rounded-none"
                placeholder={(lang === "zh" ? "再次输入密码" : "Re-enter password")}
              />
            </div>

            <div>
              <label className="text-[11px] tracking-widest uppercase text-[var(--dash-muted)] font-medium block mb-2">
                显示名称
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-4 py-3 text-sm border border-[var(--dash-border)] bg-[var(--dash-bg)] focus:bg-[var(--dash-card)] focus:border-[var(--dash-accent)] focus:outline-none transition-colors rounded-none"
                placeholder={lang === "zh" ? "您的名称" : "Your name"}
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-none">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !newEmail || !newPassword || !confirmPassword || !newName}
              className="w-full py-3 bg-[var(--dash-text)] text-white text-sm tracking-widest uppercase hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity rounded-none font-medium"
            >
              {loading ? (lang === "zh" ? "保存中..." : "Saving...") : (lang === "zh" ? "确认修改" : "Confirm")}
            </button>
          </form>
        </div>

        <p className="text-center text-[11px] text-[var(--dash-muted)] mt-6">
          {lang === "zh" ? "修改后将自动退出，请使用新凭据重新登录。" : "You will be signed out after this change. Please sign in with your new credentials."}
        </p>
      </div>
    </div>
  )
}
