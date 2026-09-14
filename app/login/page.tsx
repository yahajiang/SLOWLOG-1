"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useLang } from "@/lib/lang-context";

function LoginPageInner() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { lang } = useLang();
  const zh = lang === "zh";
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
        setError(zh ? "登录失败，请检查邮箱/密码" : "Sign-in failed. Check your email / password.");
        setLoading(false);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError(zh ? "网络错误，请重试" : "Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--yh-bg)] flex items-center justify-center p-6 relative overflow-hidden">
      {/* 纸纹 + 装订线：与加载/错误/欢迎幕同语言 */}
      <div className="paper-grain" aria-hidden />
      <span aria-hidden className="tick tick-tl" />
      <span aria-hidden className="tick tick-tr" />
      <span aria-hidden className="tick tick-bl" />
      <span aria-hidden className="tick tick-br" />

      <div className="relative w-full max-w-sm animate-[fadeInUp_0.5s_var(--ease-out)_both]">
        {/* 品牌行 */}
        <div className="flex flex-col items-center gap-4 mb-8 text-center">
          <span className="w-12 h-12 rounded-full bg-[var(--yh-text)] text-[var(--yh-bg)] flex items-center justify-center serif italic text-[18px] shadow-[0_10px_24px_rgba(0,0,0,0.16)] rotate-[-4deg]">
            S
          </span>
          <div>
            <h1 className="serif text-[26px] font-semibold tracking-tight">{zh ? "慢日志" : "SlowLog"}</h1>
            <p className="mono text-[10px] tracking-[0.24em] uppercase text-[var(--yh-muted)] mt-2">
              Admin Console · {zh ? "后台管理" : "Sign in"}
            </p>
          </div>
        </div>

        {changed && (
          <div className="mb-4 text-sm text-[var(--yh-text)] bg-[var(--dash-card)] border border-[var(--yh-border)] border-l-4 border-l-[var(--yh-accent)] px-4 py-3 rounded-none">
            {zh ? "账户已更新，请使用新凭据登录。" : "Account updated. Please sign in with your new credentials."}
          </div>
        )}

        <div className="bg-[var(--dash-card)] border border-[var(--yh-border)] rounded-none shadow-[var(--shadow-card)]">
          {/* 卡片题头：小衬线标记 + mono 眉题 */}
          <div className="flex items-center gap-2.5 px-6 pt-5" aria-hidden>
            <span className="w-5 h-px bg-[var(--yh-accent)]/60" />
            <span className="mono text-[9px] tracking-[0.28em] uppercase text-[var(--yh-muted)]">Credential Check</span>
            <span className="flex-1 h-px bg-[var(--yh-border)]" />
          </div>

          <form onSubmit={handleLogin} className="p-6 pt-4 space-y-5">
            <div>
              <label className="text-[11px] tracking-widest uppercase text-[var(--yh-muted)] font-medium block mb-2">
                {zh ? "用户名" : "Username"}
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 text-sm border border-[var(--yh-border)] bg-[var(--dash-card)] focus:border-[var(--yh-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--yh-accent)]/20 transition-colors rounded-none"
                placeholder={zh ? "请输入用户名" : "Enter username"}
                autoFocus
              />
            </div>

            <div>
              <label className="text-[11px] tracking-widest uppercase text-[var(--yh-muted)] font-medium block mb-2">
                {zh ? "密码" : "Password"}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 text-sm border border-[var(--yh-border)] bg-[var(--dash-card)] focus:border-[var(--yh-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--yh-accent)]/20 transition-colors rounded-none"
                placeholder={zh ? "请输入密码" : "Enter password"}
              />
            </div>

            {error && (
              <div className="text-sm text-[var(--yh-text)] bg-[var(--dash-card)] border border-[var(--yh-border)] border-l-4 border-l-[#c44] px-4 py-3 rounded-none">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !username || !password}
              className="w-full py-3 bg-[var(--yh-text)] text-[var(--yh-bg)] text-[12px] tracking-[0.18em] uppercase hover:bg-[var(--yh-accent)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-none min-h-[44px]"
            >
              {loading ? (zh ? "登录中..." : "Logging in...") : (zh ? "登录" : "Login")}
            </button>
          </form>
        </div>

        {/* 页脚：回站点 + 版权 */}
        <div className="flex items-center justify-between mt-5 px-1">
          <Link
            href="/"
            className="mono text-[11px] tracking-[0.14em] uppercase text-[var(--yh-muted)] hover:text-[var(--yh-text)] transition-colors"
          >
            ← {zh ? "返回站点" : "Back to site"}
          </Link>
          <span className="mono text-[10px] text-[var(--yh-muted)]/60">
            &copy; {new Date().getFullYear()} Yahajiang
          </span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <LoginPageInner />;
}
