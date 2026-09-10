/**
 * 站点 Origin 统一解析（唯一真相源）
 *
 * 只信任 NEXT_PUBLIC_SITE_URL。刻意不读取 Host / X-Forwarded-Host：
 * 伪造 Host 会让 canonical / RSS / sitemap / JSON-LD 指到攻击者域名
 * （SEO 投毒、订阅器钓鱼）。换域名 = 改 env + 重新部署。
 */

const FALLBACK = "https://example.com";

function normalize(raw: string): string {
  return raw.trim().replace(/\/+$/, "");
}

function fromEnv(): string | null {
  const v = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!v || v === "https://example.com") return null;
  return normalize(v);
}

/** 异步接口：与历史调用签名兼容（未来若接 Setting 表可在此扩展） */
export async function getSiteUrl(): Promise<string> {
  return fromEnv() ?? FALLBACK;
}

/** 同步版本：静态 metadata / 非请求上下文 */
export function getSiteUrlSync(): string {
  return fromEnv() ?? FALLBACK;
}

/** 展示用 host（不含协议），用于 OG 底栏等 */
export function getSiteHost(): string {
  try {
    return new URL(getSiteUrlSync()).host;
  } catch {
    return "example.com";
  }
}
