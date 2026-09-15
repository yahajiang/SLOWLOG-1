"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { useLang } from "@/lib/lang-context";

/**
 * 移动端首次改密（N-7）。
 *
 * 背景：`/m/dashboard` 的 layout 与 middleware 都会把「默认账户未改密」的会话
 * 重定向到**桌面版** `/dashboard/change-password`——手机用户因此被丢进桌面壳。
 * 这里按移动端版式重做同一件事，接口与流程（改密 → 登出 → 用新凭据登录）与桌面完全一致。
 *
 * 注意：本页位于 `/m/change-password`，**刻意不放在 `/m/dashboard` 之下**——
 * 后者的 layout 带有「未改密就重定向」的守卫，放进去会自我重定向成死循环。
 */
export function MChangePassword() {
  const { lang } = useLang();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newName, setNewName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!currentPassword.trim() || !newEmail.trim() || !newPassword.trim() || !newName.trim()) {
      setError(lang === "zh" ? "请填写所有字段" : "Fill all fields");
      return;
    }
    if (newPassword.length < 8) {
      setError(lang === "zh" ? "密码至少 8 位" : "Password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(lang === "zh" ? "两次密码不一致" : "Passwords do not match");
      return;
    }

    setLoading(true);
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
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || (lang === "zh" ? "修改失败" : "Update failed"));
        setLoading(false);
        return;
      }
      // 改密成功 → 重新登录以刷新 JWT（清除 needsPasswordChange 标志）
      await signOut({ redirect: false });
      router.push("/m/login?changed=1");
      router.refresh();
    } catch {
      setError(lang === "zh" ? "网络错误" : "Network error");
      setLoading(false);
    }
  }

  const inputCls =
    "w-full px-4 py-3 text-base border border-[var(--yh-border)] bg-[var(--dash-card)] focus:border-[var(--yh-muted)] focus:outline-none transition-colors rounded-none min-h-[48px]";
  const labelCls = "text-[11px] tracking-widest uppercase text-[var(--yh-muted)] font-medium block mb-2";

  return (
    <div data-m="1" className="min-h-screen bg-[var(--yh-bg)] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/m" className="inline-flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-[var(--yh-text)] text-[var(--yh-bg)] flex items-center justify-center serif italic text-[11px]">
              S
            </span>
            <span className="font-semibold text-[15px]">慢日志 · SLOWLOG</span>
          </Link>
          <p className="text-sm text-[var(--yh-muted)] mt-3">
            {lang === "zh" ? "修改默认账户" : "Update Default Account"}
          </p>
        </div>

        <div className="mb-4 text-sm text-[var(--yh-text)] bg-[var(--dash-card)] border border-[var(--yh-border)] border-l-4 border-l-[var(--yh-accent)] px-4 py-3 rounded-none">
          {lang === "zh"
            ? "检测到您使用的是默认账户，请修改邮箱、密码和名称后继续使用。"
            : "You are using the default account. Please update your email, password and name to continue."}
        </div>

        <div className="bg-[var(--dash-card)] border border-[var(--yh-border)] p-6 rounded-none">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className={labelCls}>{lang === "zh" ? "当前密码" : "Current Password"}</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={inputCls}
                placeholder={lang === "zh" ? "验证身份用" : "Verify your identity"}
              />
            </div>

            <div>
              <label className={labelCls}>{lang === "zh" ? "新邮箱" : "New email"}</label>
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className={inputCls}
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className={labelCls}>{lang === "zh" ? "新密码" : "New Password"}</label>
              <input
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={inputCls}
                placeholder={lang === "zh" ? "至少 8 位" : "At least 8 characters"}
              />
            </div>

            <div>
              <label className={labelCls}>{lang === "zh" ? "确认密码" : "Confirm Password"}</label>
              <input
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={inputCls}
                placeholder={lang === "zh" ? "再次输入密码" : "Re-enter password"}
              />
            </div>

            <div>
              <label className={labelCls}>{lang === "zh" ? "显示名称" : "Display name"}</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className={inputCls}
                placeholder={lang === "zh" ? "您的名称" : "Your name"}
              />
            </div>

            {error && (
              <div className="text-sm text-[var(--yh-text)] bg-[var(--dash-card)] border border-[var(--yh-border)] border-l-4 border-l-[#c44] px-4 py-3 rounded-none">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={
                loading ||
                !currentPassword ||
                !newEmail.trim() ||
                !newPassword.trim() ||
                !confirmPassword ||
                !newName.trim()
              }
              className="w-full py-3.5 bg-[var(--yh-text)] text-[var(--yh-bg)] text-sm tracking-widest uppercase hover:bg-[var(--yh-accent)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-none min-h-[48px]"
            >
              {loading ? (lang === "zh" ? "保存中..." : "Saving...") : lang === "zh" ? "确认修改" : "Confirm"}
            </button>
          </form>
        </div>

        <p className="text-center text-[11px] text-[var(--yh-muted)] mt-6">
          {lang === "zh"
            ? "修改后将自动退出，请使用新凭据重新登录。"
            : "You will be signed out after this change. Please sign in with your new credentials."}
        </p>
      </div>
    </div>
  );
}
