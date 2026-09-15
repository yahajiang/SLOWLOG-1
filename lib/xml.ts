/**
 * XML 输出转义工具。
 *
 * 背景（P1-3）：RSS 用 `<![CDATA[...]]>` 承载标题/摘要/分类名，而 CDATA 段落内
 * **唯一非法序列就是 `]]>`** —— 一旦用户内容包含它，CDATA 会提前闭合，
 * 后续文本被当作 XML 标记解析，导致整个 feed 变成非法 XML（订阅器直接报错）。
 */

/** CDATA 安全化：把 `]]>` 拆成两段 CDATA，语义不变但不再提前闭合 */
export function cdata(v: unknown): string {
  return String(v ?? "").replace(/\]\]>/g, "]]]]><![CDATA[>")
}

/** XML 实体转义（用于非 CDATA 承载的文本节点与属性值） */
export function xmlEscape(v: unknown): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}
