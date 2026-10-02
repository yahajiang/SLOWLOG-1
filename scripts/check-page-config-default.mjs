// pageConfig 的「未定制」哨兵必须与 Prisma 列默认逐字段一致，否则站点级默认会静默失效。
// 纯静态检查：不连库、不起服务，可在 CI 的类型检查阶段直接跑。
import { readFileSync } from "node:fs"

const schema = readFileSync("prisma/schema.prisma", "utf8").replace(/\r/g, "")
const mod = readFileSync("lib/page-config.ts", "utf8").replace(/\r/g, "")

const columnDefault = (field) => {
  const l = schema.split("\n").find((x) => new RegExp("^\\s*" + field + "\\s+Json\\b.*@default\\(").test(x))
  if (!l) throw new Error("schema 里找不到 Json 默认值: " + field)
  return JSON.parse(l.match(/@default\("(.*)"\)\s*$/)[1].replace(/\\"/g, '"'))
}

const sentinel = () => {
  const m = mod.match(/export const UNSET_PAGE_CONFIG: PageConfig = \{([\s\S]*?)\n\}/)
  if (!m) throw new Error("lib/page-config.ts 里找不到 UNSET_PAGE_CONFIG")
  const out = {}
  for (const pair of m[1].matchAll(/(\w+):\s*(?:"([^"]*)"|(true|false))/g)) {
    out[pair[1]] = pair[2] !== undefined ? pair[2] : pair[3] === "true"
  }
  return out
}

const diff = (a, b) => {
  const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])]
  return keys.filter((k) => a[k] !== b[k]).map((k) => `${k}: 哨兵=${JSON.stringify(a[k])} 列默认=${JSON.stringify(b[k])}`)
}

const unset = sentinel()
const post = columnDefault("pageConfig")
const setting = columnDefault("defaultPageConfig")

const problems = []
if (Object.keys(unset).length !== 7) problems.push(`哨兵字段数应为 7，实际 ${Object.keys(unset).length}`)
diff(unset, post).forEach((d) => problems.push("Post.pageConfig — " + d))
diff(setting, post).forEach((d) => problems.push("Setting.defaultPageConfig — " + d))

if (problems.length) {
  console.error("✗ pageConfig 默认值漂移：")
  problems.forEach((p) => console.error("   - " + p))
  process.exit(1)
}
console.log("✓ UNSET_PAGE_CONFIG == Post.pageConfig 列默认 == Setting.defaultPageConfig（7 字段全同）")
