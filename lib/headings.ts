/** 标题锚点 id：与正文渲染、TOC 共用 */
export function slugifyHeading(text: string, fallbackIndex: number): string {
  const base = text
    .toLowerCase()
    .replace(/[^\w一-鿿]+/g, "-")
    .replace(/^-|-$/g, "")
  return base || `heading-${fallbackIndex}`
}

export function dedupeHeadingId(base: string, seen: Map<string, number>): string {
  const count = seen.get(base) || 0
  seen.set(base, count + 1)
  return count === 0 ? base : `${base}-${count}`
}
