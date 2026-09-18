"use client"

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"

type TokenRow = {
  id: string
  name: string
  createdAt: string
  lastUsedAt: string | null
  revokedAt: string | null
}

type DeviceRow = {
  id: string
  fcmToken: string
  platform: string
  lastActive: string
}

function fmt(d: string | null | undefined) {
  if (!d) return "—"
  const dt = new Date(d)
  return isNaN(dt.getTime()) ? "—" : dt.toLocaleString("zh-CN")
}

function shortToken(t: string) {
  return t.length > 16 ? `${t.slice(0, 8)}…${t.slice(-6)}` : t
}

export function TokenManager() {
  const [tokens, setTokens] = useState<TokenRow[]>([])
  const [devices, setDevices] = useState<DeviceRow[]>([])
  const [name, setName] = useState("")
  const [plain, setPlain] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    const [tRes, dRes] = await Promise.all([
      fetch("/api/app/tokens"),
      fetch("/api/app/devices"),
    ])
    if (tRes.ok) setTokens(await tRes.json())
    if (dRes.ok) setDevices(await dRes.json())
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function createToken() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch("/api/app/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error || "创建失败")
        return
      }
      setPlain(data.token)
      setName("")
      await load()
    } finally {
      setBusy(false)
    }
  }

  async function revokeToken(id: string) {
    setBusy(true)
    try {
      await fetch(`/api/app/tokens?id=${encodeURIComponent(id)}`, { method: "DELETE" })
      await load()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-8">
      <section className="border border-[var(--yh-border)] bg-[var(--yh-bg)] p-5">
        <h2 className="text-sm font-medium tracking-wide mb-4">App API 令牌</h2>
        <div className="flex flex-wrap gap-2 items-end">
          <div className="min-w-[220px] flex-1">
            <label className="block text-xs text-[var(--yh-muted)] mb-1">名称（如 Pixel 8）</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="设备或用途名称" />
          </div>
          <Button onClick={createToken} disabled={busy || !name.trim()}>
            生成 Token
          </Button>
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        {plain && (
          <div className="mt-4 border border-[var(--yh-border)] p-3 bg-[var(--yh-bg)]">
            <p className="text-xs text-[var(--yh-muted)] mb-2">
              明文 Token <strong>仅显示一次</strong>，请立即复制并妥善保存：
            </p>
            <code className="block break-all text-sm font-mono">{plain}</code>
            <div className="mt-2 flex gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  void navigator.clipboard?.writeText(plain)
                }}
              >
                复制
              </Button>
              <Button variant="ghost" onClick={() => setPlain(null)}>
                我已保存
              </Button>
            </div>
          </div>
        )}

        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-[var(--yh-muted)] border-b border-[var(--yh-border)]">
                <th className="py-2 pr-3">名称</th>
                <th className="py-2 pr-3">创建时间</th>
                <th className="py-2 pr-3">最近使用</th>
                <th className="py-2 pr-3">状态</th>
                <th className="py-2">操作</th>
              </tr>
            </thead>
            <tbody>
              {tokens.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-4 text-[var(--yh-muted)]">
                    暂无令牌
                  </td>
                </tr>
              )}
              {tokens.map((t) => (
                <tr key={t.id} className="border-b border-[var(--yh-border)]">
                  <td className="py-2 pr-3">{t.name}</td>
                  <td className="py-2 pr-3 text-[var(--yh-muted)]">{fmt(t.createdAt)}</td>
                  <td className="py-2 pr-3 text-[var(--yh-muted)]">{fmt(t.lastUsedAt)}</td>
                  <td className="py-2 pr-3">
                    {t.revokedAt ? (
                      <span className="text-[var(--yh-muted)]">已撤销</span>
                    ) : (
                      <span className="text-[var(--yh-accent)]">有效</span>
                    )}
                  </td>
                  <td className="py-2">
                    {!t.revokedAt && (
                      <Button variant="secondary" onClick={() => revokeToken(t.id)} disabled={busy}>
                        撤销
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="border border-[var(--yh-border)] bg-[var(--yh-bg)] p-5">
        <h2 className="text-sm font-medium tracking-wide mb-4">推送设备（FCM）</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-[var(--yh-muted)] border-b border-[var(--yh-border)]">
                <th className="py-2 pr-3">Token</th>
                <th className="py-2 pr-3">平台</th>
                <th className="py-2">最近活跃</th>
              </tr>
            </thead>
            <tbody>
              {devices.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-4 text-[var(--yh-muted)]">
                    暂无设备
                  </td>
                </tr>
              )}
              {devices.map((d) => (
                <tr key={d.id} className="border-b border-[var(--yh-border)]">
                  <td className="py-2 pr-3 font-mono text-xs">{shortToken(d.fcmToken)}</td>
                  <td className="py-2 pr-3">{d.platform}</td>
                  <td className="py-2 text-[var(--yh-muted)]">{fmt(d.lastActive)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
