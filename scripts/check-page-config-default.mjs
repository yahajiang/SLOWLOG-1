// pageConfig 的「未定制」哨兵必须与各处默认值逐字段一致，否则站点级默认会静默失效。
// 纯静态检查：不连库、不起服务，可在 CI 的类型检查阶段直接跑。
import { readFileSync } from "node:fs"
import { execFileSync } from "node:child_process"
const G = "git"

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

const settingsDefaults = () => {
  const s = readFileSync("lib/settings-shared.ts", "utf8").replace(/\r/g, "")
  const from = s.indexOf("SETTINGS_DEFAULTS")
  if (from < 0) throw new Error("lib/settings-shared.ts 里找不到 SETTINGS_DEFAULTS")
  const i = s.indexOf("defaultPageConfig:", from)
  if (i < 0) throw new Error("SETTINGS_DEFAULTS 里没有 defaultPageConfig")
  const o = s.indexOf("{", i)
  let d = 0, j = o
  for (; j < s.length; j++) { if (s[j] === "{") d++; else if (s[j] === "}") { d--; if (!d) break } }
  const out = {}
  for (const pair of s.slice(o, j).matchAll(/(\w+):\s*(?:"([^"]*)"|(true|false))/g)) {
    out[pair[1]] = pair[2] !== undefined ? pair[2] : pair[3] === "true"
  }
  return out
}

// 指纹：整组默认值被就地硬写（哨兵与 settings-shared 之外的字面量副本）
const strayLiterals = () => {
  const out = execFileSync(G, ["grep", "-n", "-P", 'layout:\\s*"standard",\\s*theme:\\s*"light"|\\{"layout":"standard","theme":"light"', "--", "app", "components", "lib", "prisma"], { encoding: "utf8" })
  return out.split("\n").filter(Boolean)
    .map((l) => l.split(":").slice(0, 2).join(":"))
    .filter((p) => !p.startsWith("prisma/schema.prisma"))
    .filter((p) => !p.startsWith("prisma/migrations/")) // 迁移 SQL 是不可变历史，不参与防漂移
}

const unset = sentinel()
const post = columnDefault("pageConfig")
const setting = columnDefault("defaultPageConfig")
const shared = settingsDefaults()

const problems = []
if (Object.keys(unset).length !== 7) problems.push(`哨兵字段数应为 7，实际 ${Object.keys(unset).length}`)
diff(unset, post).forEach((d) => problems.push("Post.pageConfig — " + d))
diff(setting, post).forEach((d) => problems.push("Setting.defaultPageConfig — " + d))
diff(shared, post).forEach((d) => problems.push("SETTINGS_DEFAULTS.defaultPageConfig — " + d))
strayLiterals().forEach((p) => problems.push("又有就地硬写整组默认值的副本：" + p))

if (problems.length) {
  console.error("✗ pageConfig 默认值漂移：")
  problems.forEach((p) => console.error("   - " + p))
  process.exit(1)
}
console.log("✓ 四处默认全等（哨兵 / 两张 Prisma 列默认 / SETTINGS_DEFAULTS），且无就地硬写副本")
