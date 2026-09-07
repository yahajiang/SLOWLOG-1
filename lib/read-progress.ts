// 阅读进度记忆（v0.3 P1-9）：localStorage 记录每篇滚动深度百分比。
// 只记"读到过的最深"（回滚不降）；≥98% 视为读完自动清除。
const KEY = (id: string) => `sl-read:${id}`;

export function getReadProgress(id: string): number | null {
  try {
    const v = localStorage.getItem(KEY(id));
    if (!v) return null;
    const n = parseInt(v, 10);
    return isNaN(n) ? null : Math.max(0, Math.min(100, n));
  } catch {
    return null;
  }
}

export function saveReadProgress(id: string, pct: number) {
  try {
    const prev = getReadProgress(id) || 0;
    if (pct > prev) localStorage.setItem(KEY(id), String(Math.round(pct)));
  } catch {}
}

export function clearReadProgress(id: string) {
  try {
    localStorage.removeItem(KEY(id));
  } catch {}
}
