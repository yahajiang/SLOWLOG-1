// 后台所有「列表/对象」加载的唯一实现。
// 之前每个页面各写一条 fetch().then(r=>r.json())：既不判 r.ok 也没有 catch，
// 于是 401（会话过期）、500、断网任何一种失败都不会把 loading 置回 false——
// 用户看到的就是骨架屏转到天荒地老，且没有任何提示。统一在这里收口：
// 永不 reject，失败返回 error 字符串，由调用方渲染 ListError（可重试）。
export type ListResult<T> = { data: T[]; total: number; error: null } | { data: never[]; total: 0; error: string }
export type ObjectResult<T> = { data: T | null; error: null } | { data: null; error: string }

function message(status: number | null): string {
  return status === null ? "network" : `HTTP ${status}`
}

async function request(url: string): Promise<{ res: Response | null; raw: unknown }> {
  try {
    const res = await fetch(url, { cache: "no-store" })
    const raw = await res.json().catch(() => null)
    return { res, raw }
  } catch {
    return { res: null, raw: null }
  }
}

export async function loadList<T = any>(url: string): Promise<ListResult<T>> {
  const { res, raw } = await request(url)
  if (!res?.ok) return { data: [], total: 0, error: message(res ? res.status : null) }
  const data = (Array.isArray(raw) ? raw : Array.isArray((raw as any)?.items) ? (raw as any).items : []) as T[]
  const header = Number(res.headers.get("X-Total-Count"))
  return { data, total: Number.isFinite(header) && header > 0 ? header : data.length, error: null }
}

export async function loadObject<T = any>(url: string): Promise<ObjectResult<T>> {
  const { res, raw } = await request(url)
  if (!res?.ok) return { data: null, error: message(res ? res.status : null) }
  return { data: raw as T, error: null }
}
