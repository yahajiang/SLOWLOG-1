"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useLang } from "@/lib/lang-context";

/** 移动端登录：与桌面同流程（next-auth credentials → /dashboard），居中卡片 */
export function MLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { lang } = useLang();
  const changed = searchParams.get("changed");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const email = (username.includes("@") ? username : `${username}@slowlog.dev`).toLowerCase().trim();
      const { signIn } = await import("next-auth/react");
      const res = await signIn("credentials", { email, password, redirect: false });
      if (res?.error) {
        setError(lang === "zh" ? "登录失败，请检查邮箱/密码" : "Sign in failed. Check your email/password.");
        setLoading(false);
        return;
      }
      router.push("/m/dashboard");
      router.refresh();
    } catch {
      setError(lang === "zh" ? "网络错误" : "Network error");
      setLoading(false);
    }
  }

  return (
    <div data-m="1" className="min-h-screen bg-[var(--yh-bg)] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/m" className="inline-flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-zinc-900 text-white flex items-center justify-center serif italic text-[11px]">S</span>
            <span className="font-semibold text-[15px]">慢日志 · SLOWLOG</span>
          </Link>
          <p className="text-sm text-[var(--yh-muted)] mt-3">{lang === "zh" ? "后台管理" : "Admin Panel"}</p>
        </div>

        {changed && (
          <div className="mb-4 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 px-4 py-3 rounded-none">
            {lang === "zh" ? "账户已更新，请使用新凭据登录。" : "Account updated. Please sign in with your new credentials."}
          </div>
        )}

        <div className="bg-[var(--dash-card)] border border-[var(--yh-border)] p-6 rounded-none">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="text-[11px] tracking-widest uppercase text-[var(--yh-muted)] font-medium block mb-2">
                {lang === "zh" ? "用户名" : "Username"}
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 text-base border border-[var(--yh-border)] bg-[var(--dash-card)] focus:border-zinc-400 focus:outline-none transition-colors rounded-none"
                placeholder={lang === "zh" ? "请输入用户名" : "Enter username"}
                autoFocus
              />
            </div>
            <div>
              <label className="text-[11px] tracking-widest uppercase text-[var(--yh-muted)] font-medium block mb-2">
                {lang === "zh" ? "密码" : "Password"}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 text-base border border-[var(--yh-border)] bg-[var(--dash-card)] focus:border-zinc-400 focus:outline-none transition-colors rounded-none"
                placeholder={lang === "zh" ? "请输入密码" : "Enter password"}
              />
            </div>
            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-none">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading || !username || !password}
              className="w-full py-3.5 bg-zinc-900 text-white text-sm tracking-widest uppercase hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-none min-h-[48px]"
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
