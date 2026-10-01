"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import { useLang } from "@/lib/lang-context"
import { inputCls } from "@/components/ui/Input"

export default function ChangePasswordPage() {
  const { lang } = useLang()
  const [currentPassword, setCurrentPassword] = useState("")
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

    if (!currentPassword.trim() || !newEmail.trim() || !newPassword.trim() || !newName.trim()) {
      setError(lang === "zh" ? "请填写所有字段" : "Fill all fields")
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
          currentPassword: currentPassword,
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
      // 手机 UA 回移动登录，避免改密后困在桌面壳
      const isMobile = /Android.*Mobile|iPhone|iPod|Windows Phone/i.test(navigator.userAgent)
      router.push(isMobile ? "/m/login?changed=1" : "/login?changed=1")
    } catch {
      setError(lang === "zh" ? "网络错误" : "Network error")
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

        <div className="bg-[var(--dash-card)] border border-[var(--dash-border)] p-8 rounded-none shadow-[var(--shadow-card)] section-in">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-[11px] tracking-widest uppercase text-[var(--dash-muted)] font-medium block mb-2">
                {lang === "zh" ? "当前密码" : "Current Password"}
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={inputCls("lg", "admin")}
                placeholder={lang === "zh" ? "验证身份用" : "Verify your identity"}
              />
            </div>

            <div>
              <label className="text-[11px] tracking-widest uppercase text-[var(--dash-muted)] font-medium block mb-2">
                {lang === "zh" ? "新邮箱" : "New email"}
              </label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className={inputCls("lg", "admin")}
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
                className={inputCls("lg", "admin")}
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
                className={inputCls("lg", "admin")}
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
                className={inputCls("lg", "admin")}
                placeholder={lang === "zh" ? "您的名称" : "Your name"}
              />
            </div>

            {error && (
              <div role="alert" className="text-sm text-[var(--dash-danger)] bg-[var(--dash-danger-soft)] border border-[var(--dash-danger-border)] px-4 py-3 rounded-none animate-[ffIn_0.2s_ease-out]">
                {error}
              </div>
            )}

            {/* P3-18：与提交时的 trim 保持一致——否则用户输入纯空格也能点提交，
                请求发出后才被服务端校验拒绝，多一次无意义的往返与报错 */}
            <button
              type="submit"
              disabled={loading || !currentPassword || !newEmail.trim() || !newPassword.trim() || !confirmPassword || !newName.trim()}
              className="w-full py-3 min-h-[48px] bg-[var(--dash-text)] text-[var(--dash-bg)] text-sm tracking-widest uppercase hover:opacity-90 active:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity rounded-none font-medium"
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
