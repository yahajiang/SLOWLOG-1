"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signOut } from "next-auth/react"

export default function ChangePasswordPage() {
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
      setError("密码至少 8 位")
      return
    }
    if (newPassword !== confirmPassword) {
      setError("两次密码不一致")
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
        setError(data.error || "修改失败")
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
          <h1 className="text-2xl font-semibold text-[var(--dash-text)] mb-2">修改默认账户</h1>
          <p className="text-sm text-[var(--dash-muted)]">
            检测到您使用的是默认账户，请修改邮箱、密码和名称后继续使用。
          </p>
        </div>

        <div className="bg-[var(--dash-card)] border border-[var(--dash-border)] p-8 rounded-[var(--radius-md)]">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-[11px] tracking-widest uppercase text-[var(--dash-muted)] font-medium block mb-2">
                新邮箱
              </label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full px-4 py-3 text-sm border border-[var(--dash-border)] bg-zinc-50 focus:bg-white focus:border-[var(--dash-accent)] focus:outline-none transition-colors rounded-[var(--radius-sm)]"
                placeholder="your@email.com"
                autoFocus
              />
            </div>

            <div>
              <label className="text-[11px] tracking-widest uppercase text-[var(--dash-muted)] font-medium block mb-2">
                新密码
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 text-sm border border-[var(--dash-border)] bg-zinc-50 focus:bg-white focus:border-[var(--dash-accent)] focus:outline-none transition-colors rounded-[var(--radius-sm)]"
                placeholder="至少 8 位"
              />
            </div>

            <div>
              <label className="text-[11px] tracking-widest uppercase text-[var(--dash-muted)] font-medium block mb-2">
                确认密码
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 text-sm border border-[var(--dash-border)] bg-zinc-50 focus:bg-white focus:border-[var(--dash-accent)] focus:outline-none transition-colors rounded-[var(--radius-sm)]"
                placeholder="再次输入密码"
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
                className="w-full px-4 py-3 text-sm border border-[var(--dash-border)] bg-zinc-50 focus:bg-white focus:border-[var(--dash-accent)] focus:outline-none transition-colors rounded-[var(--radius-sm)]"
                placeholder="您的名称"
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-[var(--radius-sm)]">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !newEmail || !newPassword || !confirmPassword || !newName}
              className="w-full py-3 bg-[var(--dash-text)] text-white text-sm tracking-widest uppercase hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity rounded-[var(--radius-sm)] font-medium"
            >
              {loading ? "保存中..." : "确认修改"}
            </button>
          </form>
        </div>

        <p className="text-center text-[11px] text-[var(--dash-muted)] mt-6">
          修改后将自动退出，请使用新凭据重新登录。
        </p>
      </div>
    </div>
  )
}
