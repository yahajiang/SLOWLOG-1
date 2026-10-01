"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useLang } from "@/lib/lang-context";
import { submitCredentialLogin } from "@/lib/login-shared";

/** 移动端登录：与桌面**共用 lib/login-shared 的同一提交流程**（此前两边各写一遍 signIn） */
export function MLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const { t, lang } = useLang();
  const changed = searchParams.get("changed");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const out = await submitCredentialLogin(username, password, "/m/dashboard");
    if (out !== "ok") {
      setError(out === "invalid" ? t.loginFailed : t.loginNetworkError);
      setLoading(false);
    }
  }

  return (
    <div data-m="1" className="min-h-screen bg-[var(--yh-bg)] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/m" className="inline-flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-[var(--yh-text)] text-[var(--yh-bg)] flex items-center justify-center serif italic text-[11px]">S</span>
            <span className="font-semibold text-[15px]">慢日志 · SLOWLOG</span>
          </Link>
          <p className="text-sm text-[var(--yh-muted)] mt-3">{lang === "zh" ? "后台管理" : "Admin Panel"}</p>
        </div>

        {changed && (
          <div className="mb-4 text-sm text-[var(--yh-text)] bg-[var(--dash-card)] border border-[var(--yh-border)] border-l-4 border-l-[var(--yh-accent)] px-4 py-3 rounded-none">
            {lang === "zh" ? "账户已更新，请使用新凭据登录。" : "Account updated. Please sign in with your new credentials."}
          </div>
        )}

        <div className="bg-[var(--dash-card)] border border-[var(--yh-border)] p-6 rounded-none">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="m-login-username" className="text-[11px] tracking-widest uppercase text-[var(--yh-muted)] font-medium block mb-2">
                {lang === "zh" ? "用户名" : "Username"}
              </label>
              <input
                id="m-login-username"
                name="username"
                autoComplete="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 text-base border border-[var(--yh-border)] bg-[var(--dash-card)] focus:border-[var(--yh-muted)] focus:outline-none transition-colors rounded-none"
                placeholder={lang === "zh" ? "请输入用户名" : "Enter username"}
                autoFocus
              />
            </div>
            <div>
              <label htmlFor="m-login-password" className="text-[11px] tracking-widest uppercase text-[var(--yh-muted)] font-medium block mb-2">
                {lang === "zh" ? "密码" : "Password"}
              </label>
              <input
                id="m-login-password"
                name="password"
                autoComplete="current-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 text-base border border-[var(--yh-border)] bg-[var(--dash-card)] focus:border-[var(--yh-muted)] focus:outline-none transition-colors rounded-none"
                placeholder={lang === "zh" ? "请输入密码" : "Enter password"}
              />
            </div>
            {error && (
              <div className="text-sm text-[var(--yh-text)] bg-[var(--dash-card)] border border-[var(--yh-border)] border-l-4 border-l-[var(--dash-danger)] px-4 py-3 rounded-none">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading || !username || !password}
              className="w-full py-3.5 bg-[var(--yh-text)] text-[var(--yh-bg)] text-sm tracking-widest uppercase hover:bg-[var(--yh-accent)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-none min-h-[48px] active:opacity-60"
            >
              {loading ? (lang === "zh" ? "登录中..." : "Logging in...") : lang === "zh" ? "登录" : "Login"}
            </button>
          </form>
        </div>

        <p className="text-center text-[11px] text-[var(--yh-muted)] mt-6">
          &copy; {new Date().getFullYear()} Yahajiang
        </p>
      </div>
    </div>
  );
}
