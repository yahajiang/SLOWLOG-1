// 性能预算检测（v0.3 P2）：构建产物 gzip 体积 vs 红线。
// 用法：先 next build（生产构建），再 node scripts/perf-budget.mjs
// 超线退出码非 0——可接 CI/推送前检查。预算线按当前基线 × 1.2 设定。
import { execSync } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

const NEXT = join(process.cwd(), ".next");

function gzipSize(file) {
  return gzipSync(require("fs").readFileSync(file)).length;
}

function walk(dir, ext, acc = []) {
  for (const f of readdirSync(dir)) {
    const full = join(dir, f);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, ext, acc);
    else if (f.endsWith(ext)) acc.push(full);
  }
  return acc;
}

const jsFiles = walk(join(NEXT, "static", "chunks"), ".js");
const cssFiles = walk(join(NEXT, "static", "css"), ".css");

const jsGzip = jsFiles.reduce((a, f) => a + gzipSize(f), 0);
const cssGzip = cssFiles.reduce((a, f) => a + gzipSize(f), 0);
const totalKB = Math.round((jsGzip + cssGzip) / 1024);
const jsKB = Math.round(jsGzip / 1024);

// 红线（当前基线约 180KB JS gzip；预算 = 基线 × 1.4 余量）
const BUDGET_JS_KB = 260;
const BUDGET_TOTAL_KB = 320;

console.log(`[perf] JS chunks: ${jsFiles.length} 个, gzip 共 ${jsKB} KB`);
console.log(`[perf] CSS: gzip 共 ${Math.round(cssGzip / 1024)} KB`);
console.log(`[perf] 总计 ${totalKB} KB / 预算 ${BUDGET_TOTAL_KB} KB`);

let fail = false;
if (jsKB > BUDGET_JS_KB) { console.error(`✗ JS 超预算：${jsKB} > ${BUDGET_JS_KB} KB——检查新依赖`); fail = true }
if (totalKB > BUDGET_TOTAL_KB) { console.error(`✗ 总体积超预算：${totalKB} > ${BUDGET_TOTAL_KB} KB`); fail = true }
console.log(fail ? "[perf] ✗ 超线" : "[perf] ✓ 在预算内");
process.exit(fail ? 1 : 0);
