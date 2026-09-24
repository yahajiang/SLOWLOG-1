import { existsSync } from "fs"
import path from "path"

/**
 * 导入即生效的副作用模块：把 fontconfig 指到仓库自带的 TTF。
 *
 * ## 为什么需要
 * sharp 光栅化 SVG 走的是 librsvg → Pango → fontconfig 这条链路。Vercel 的
 * 函数运行时不带任何系统字体，fontconfig 找不到一个可用字面，于是位图封面上
 * 每个 `<text>` 都被画成豆腐块（方框）—— 图案正常、文字全废，正是线上现象。
 * Web 端同源的 CoverArt.tsx 在浏览器里排版，所以只有 App 看到的 PNG 出问题。
 *
 * ## 为什么必须是「先于 sharp 的 import」
 * fontconfig 只在进程内首次排版时读取 FONTCONFIG_FILE 并缓存配置，之后再改
 * 环境变量对本进程无效。所以这里不做成函数调用，而是靠模块加载顺序保证时序：
 * 路由文件把它写在 `import sharp` 之前。
 *
 * 配置文件本身见 assets/cover-fonts/fonts.conf（只含随包字体，不引系统配置，
 * 以保证本地与线上渲染结果一致）。
 */
const FONTCONFIG_FILE = path.join(process.cwd(), "assets", "cover-fonts", "fonts.conf")

if (existsSync(FONTCONFIG_FILE)) {
  // 两个变量都设：FONTCONFIG_FILE 是标准入口，FONTCONFIG_PATH 指向同目录
  // （配置文件正名为 fonts.conf），以覆盖个别构建只认路径变量的情况。
  process.env.FONTCONFIG_FILE = FONTCONFIG_FILE
  process.env.FONTCONFIG_PATH = path.dirname(FONTCONFIG_FILE)
} else {
  // 只在异常路径出声：正常冷启动零噪声。命中这行说明 assets/cover-fonts 没被
  // 打进函数包（next.config 的 outputFileTracingIncludes 失效），
  // 后果是封面文字退回豆腐块 —— 与修复前的线上表现一致，可据此一眼定位。
  console.error(`[cover-fonts] 缺少 ${FONTCONFIG_FILE}，位图封面文字将无字体可用`)
}
