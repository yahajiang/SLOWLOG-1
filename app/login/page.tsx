"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLang } from "@/lib/lang-context";

function LoginPageInner() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, lang } = useLang();
  const changed = searchParams.get("changed");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const email = (username.includes("@") ? username : `${username}@slowlog.dev`).toLowerCase().trim()
      const { signIn } = await import("next-auth/react")
      const res = await signIn("credentials", { email, password, redirect: false })
      if (res?.error) {
        setError("登录失败，请检查邮箱/密码");
        setLoading(false);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("网络错误");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--yh-bg)] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-zinc-900 mb-2">{t.siteName}</h1>
          <p className="text-sm text-[var(--yh-muted)]">{lang === "zh" ? "后台管理" : "Admin Panel"}</p>
        </div>

        {changed && (
          <div className="mb-4 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 px-4 py-3 rounded-none">
            {lang === "zh" ? "账户已更新，请使用新凭据登录。" : "Account updated. Please sign in with your new credentials."}
          </div>
        )}

        <div className="bg-[var(--dash-card)] border border-[var(--yh-border)] p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="text-[11px] tracking-widest uppercase text-[var(--yh-muted)] font-medium block mb-2">
                {lang === "zh" ? "用户名" : "Username"}
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 text-sm border border-[var(--yh-border)] bg-[var(--dash-card)] focus:bg-[var(--dash-card)] focus:border-zinc-400 focus:outline-none transition-colors"
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
                className="w-full px-4 py-3 text-sm border border-[var(--yh-border)] bg-[var(--dash-card)] focus:bg-[var(--dash-card)] focus:border-zinc-400 focus:outline-none transition-colors"
                placeholder={lang === "zh" ? "请输入密码" : "Enter password"}
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !username || !password}
              className="w-full py-3 bg-zinc-900 text-white text-sm tracking-widest uppercase hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (lang === "zh" ? "登录中..." : "Logging in...") : (lang === "zh" ? "登录" : "Login")}
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

export default function LoginPage() {
  return <LoginPageInner />;
}
