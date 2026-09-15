// 验证 P0-1 修复后的 slug 生成
import { slugify, slugFromTitle } from "../../lib/slug"

const titles = ["设计原则", "代码之美", "Hello 世界", "Hello World", "!!!", "", "   ", "React 19 新特性"]
const seen = new Set<string>()
for (const t of titles) {
  const s = await slugFromTitle(t)
  const dup = seen.has(s)
  seen.add(s)
  console.log(
    `${JSON.stringify(t).padEnd(20)} slugify=${JSON.stringify(slugify(t)).padEnd(16)} slugFromTitle=${JSON.stringify(s).padEnd(28)} ${dup ? "❌ 重复" : "✓"}`
  )
}
console.log(`\n共 ${titles.length} 个输入，唯一 slug ${seen.size} 个 → ${seen.size === titles.length ? "✅ 全部唯一" : "❌ 存在冲突"}`)
