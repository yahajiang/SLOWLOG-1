// 归档搜索的唯一匹配规则。
// ⚠️ 与 lib/posts.ts `getPostsPage` 里那段 SQL 的 OR 条件同口径（title / titleZh / excerpt / excerptZh /
// category.name）：改字段必须两处一起改，否则服务端按摘要命中的文章会被客户端二次过滤丢掉。
// 桌面/平板的时间线走「服务端已过滤 + 本模块即时收窄」（消掉 320ms 防抖的回车等待）；
// 移动版一次载入全部文章，只用本模块。

export function postMatchesQuery(p: any, q: string): boolean {
  const needle = q.trim().toLowerCase()
  if (!needle) return true
  // title / excerpt / category 都可能缺失，统一兜底空串，避免 .toLowerCase() 抛错白屏（P2-13 同口径）
  const hay = [p?.title, p?.titleZh, p?.excerpt, p?.excerptZh, p?.category?.name ?? p?.category]
  return hay.some((v) => typeof v === "string" && v.toLowerCase().includes(needle))
}

/** 按搜索词收窄年份分组，并丢掉整年都被过滤空的组（不留只有年号的空段） */
export function filterYearsByQuery(years: [number, any[]][], q: string): [number, any[]][] {
  if (!q.trim()) return years
  return years
    .map(([y, arr]) => [y, arr.filter((p) => postMatchesQuery(p, q))] as [number, any[]])
    .filter(([, arr]) => arr.length > 0)
}

export function countYears(years: [number, any[]][]): number {
  return years.reduce((acc, [, arr]) => acc + arr.length, 0)
}
