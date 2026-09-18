import { createHash } from "node:crypto"
import type { NextRequest } from "next/server"
import type { Session } from "next-auth"
import { prisma } from "./prisma"
import { auth } from "./auth"

export function sha256Hex(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex")
}

/** 解析 Bearer Token；无效/已撤销返回 null。命中时 fire-and-forget 更新 lastUsedAt。 */
export async function bearerToken(req: Request): Promise<{ ok: true; tokenId: string } | null> {
  const header = req.headers.get("authorization") || req.headers.get("Authorization") || ""
  const m = /^Bearer\s+(.+)$/i.exec(header.trim())
  if (!m) return null
  const plain = m[1].trim()
  if (!plain || plain.length < 16 || plain.length > 256) return null
  const tokenHash = sha256Hex(plain)
  try {
    const row = await prisma.apiToken.findUnique({ where: { tokenHash } })
    if (!row || row.revokedAt) return null
    void prisma.apiToken
      .update({ where: { id: row.id }, data: { lastUsedAt: new Date() } })
      .catch(() => {})
    return { ok: true, tokenId: row.id }
  } catch {
    return null
  }
}

export type SessionOrBearer =
  | { kind: "session"; session: Session }
  | { kind: "bearer"; tokenId: string }

/**
 * 写接口门禁：Cookie 会话优先，其次 App Bearer Token。
 * 强制改密仅作用于 session（Token 由改密后的管理员创建）。
 */
export async function requireSessionOrBearer(req: NextRequest | Request): Promise<SessionOrBearer | null> {
  const session = await auth()
  if (session) return { kind: "session", session: session as Session }
  const bearer = await bearerToken(req)
  if (bearer) return { kind: "bearer", tokenId: bearer.tokenId }
  return null
}
