"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLang, LangProvider } from "@/lib/lang-context";

function LoginPageInner() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isDefault, setIsDefault] = useState(false);
  const [showChangeModal, setShowChangeModal] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newName, setNewName] = useState("");
  const [changeError, setChangeError] = useState("");
  const [changeLoading, setChangeLoading] = useState(false);
  const [changeSuccess, setChangeSuccess] = useState(false);
  const router = useRouter();
  const { t, lang } = useLang();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "登录失败");
        setLoading(false);
        return;
      }

      if (data.isDefault) {
        setIsDefault(true);
        setShowChangeModal(true);
        setLoading(false);
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setError("网络错误");
      setLoading(false);
    }
  }

  async function handleUpdateAccount(e: React.FormEvent) {
    e.preventDefault();
    setChangeError("");

    if (!newUsername.trim() || !newPassword.trim() || !newName.trim()) {
      setChangeError("请填写所有字段");
      return;
    }

    setChangeLoading(true);

    try {
      const res = await fetch("/api/auth/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentUsername: username,
          username: newUsername.trim(),
          password: newPassword.trim(),
          name: newName.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setChangeError(data.error || "更新失败");
        setChangeLoading(false);
        return;
      }

      setChangeSuccess(true);
      setTimeout(() => {
        router.push("/admin");
        router.refresh();
      }, 1500);
    } catch {
      setChangeError("网络错误");
      setChangeLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--yh-bg)] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-zinc-900 mb-2">{t.siteName}</h1>
          <p className="text-sm text-zinc-500">{lang === "zh" ? "后台管理" : "Admin Panel"}</p>
        </div>

        <div className="bg-white border border-zinc-200 p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="text-[11px] tracking-widest uppercase text-zinc-500 font-medium block mb-2">
                {lang === "zh" ? "用户名" : "Username"}
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 text-sm border border-zinc-200 bg-zinc-50 focus:bg-white focus:border-zinc-400 focus:outline-none transition-colors"
                placeholder={lang === "zh" ? "请输入用户名" : "Enter username"}
                autoFocus
              />
            </div>

            <div>
              <label className="text-[11px] tracking-widest uppercase text-zinc-500 font-medium block mb-2">
                {lang === "zh" ? "密码" : "Password"}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 text-sm border border-zinc-200 bg-zinc-50 focus:bg-white focus:border-zinc-400 focus:outline-none transition-colors"
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

        <p className="text-center text-[11px] text-zinc-400 mt-6">
          &copy; {new Date().getFullYear()} Yahajiang
        </p>
      </div>

      {/* Change Default Account Modal */}
      {showChangeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white border border-zinc-200 p-8 w-full max-w-md shadow-xl">
            {changeSuccess ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-zinc-900 mb-2">
                  {lang === "zh" ? "账户信息已更新" : "Account Updated"}
                </h3>
                <p className="text-sm text-zinc-500">
                  {lang === "zh" ? "正在跳转到后台..." : "Redirecting to admin..."}
                </p>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-zinc-900 mb-2">
                    {lang === "zh" ? "修改账户信息" : "Update Account"}
                  </h3>
                  <p className="text-sm text-zinc-500">
                    {lang === "zh"
                      ? "检测到您使用的是默认账户，请修改用户名和密码后继续使用。"
                      : "Default account detected. Please update username and password to continue."}
                  </p>
                </div>

                <form onSubmit={handleUpdateAccount} className="space-y-4">
                  <div>
                    <label className="text-[11px] tracking-widest uppercase text-zinc-500 font-medium block mb-1.5">
                      {lang === "zh" ? "新用户名" : "New Username"}
                    </label>
                    <input
                      type="text"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      className="w-full px-4 py-2.5 text-sm border border-zinc-200 bg-zinc-50 focus:bg-white focus:border-zinc-400 focus:outline-none transition-colors"
                      placeholder={lang === "zh" ? "设置新用户名" : "Set new username"}
                    />
                  </div>

                  <div>
                    <label className="text-[11px] tracking-widest uppercase text-zinc-500 font-medium block mb-1.5">
                      {lang === "zh" ? "新密码" : "New Password"}
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-2.5 text-sm border border-zinc-200 bg-zinc-50 focus:bg-white focus:border-zinc-400 focus:outline-none transition-colors"
                      placeholder={lang === "zh" ? "设置新密码" : "Set new password"}
                    />
                  </div>

                  <div>
                    <label className="text-[11px] tracking-widest uppercase text-zinc-500 font-medium block mb-1.5">
                      {lang === "zh" ? "显示名称" : "Display Name"}
                    </label>
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full px-4 py-2.5 text-sm border border-zinc-200 bg-zinc-50 focus:bg-white focus:border-zinc-400 focus:outline-none transition-colors"
                      placeholder={lang === "zh" ? "您的名称" : "Your name"}
                    />
                  </div>

                  {changeError && (
                    <div className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3">
                      {changeError}
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={changeLoading || !newUsername || !newPassword || !newName}
                      className="flex-1 py-2.5 bg-zinc-900 text-white text-sm tracking-widest uppercase hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {changeLoading
                        ? (lang === "zh" ? "保存中..." : "Saving...")
                        : (lang === "zh" ? "保存" : "Save")}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <LangProvider>
      <LoginPageInner />
    </LangProvider>
  );
}
