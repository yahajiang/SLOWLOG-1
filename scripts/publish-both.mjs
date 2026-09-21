#!/usr/bin/env node
/**
 * 慢日志 · 双仓库发布（fail-closed 版）
 *
 * 用法：
 *   node scripts/publish-both.mjs          # dry-run：只做检查与清洗，不推送任何远端
 *   node scripts/publish-both.mjs --yes    # 真正推送（私人仓 + 公开清洗仓）
 *
 * ⚠️ 本脚本是 2026-09-15 审查后对旧版的**安全重写**。旧版存在四处失配，
 *    第一条会直接复刻 2026-09-13 的公开仓泄漏事故：
 *      ① STRIP 漏了 content-export —— 而该目录在私有仓被 git add -f 跟踪（.gitignore 对它无效）；
 *      ② 终检复用同一个 STRIP 列表 → 漏项时"零残留"检查必然假通过；
 *      ③ 用 `merge -X ours` 同步 → 远端独有文件会被原样并入（该流程已废止）；
 *      ④ `-c http.proxy= -c https.proxy=` 禁用代理 → 本机当前会 21s 超时，推送必失败。
 *
 * 本版的安全设计：
 *   ① **清洗列表（FILTER_PATHS）与审计列表（AUDIT_FORBIDDEN）分开定义**，且审计列表更严——
 *      从结构上排除"用同一份列表自证清白"这类假通过；
 *   ② 审计同时扫描**全历史**与**清洗后生成的树**两条，任一命中即 exit 1，不推送；
 *   ③ 默认 dry-run，只有显式 `--yes` 才会推送；
 *   ④ 不再使用 merge；公开仓用 `--force-with-lease=main:<ls-remote sha>` 显式租约强推；
 *   ⑤ 不触碰代理设置（本机推送依赖系统代理，禁用即超时）；
 *   ⑥ 任何一步失败立即退出，不做"重试到成功为止"的掩盖。
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

// ── 配置 ────────────────────────────────────────────────────────────────
const REPO_DIR = process.cwd();
const ORIGIN = "https://github.com/yahajiang/slowlog.git";
const PUBLIC = "https://github.com/yahajiang/SLOWLOG-1.git";
const TMP = path.join(process.env.TEMP || process.env.TMP || ".", "slowlog1-clean");
const BLUEPRINT = "docs/design/design-blueprint.md";
const PY = "C:/Users/Yahajiang/.workbuddy/binaries/python/envs/default/Scripts/python.exe";

/**
 * 用于 filter-repo 的剔除路径（与历史标准流程一致）。
 * `mobile-preview` 是 2026-09-21 追加：13 张界面截图 / 5.5MB 二进制产出物，属**运行产物而非源码**，
 * 公开仓只留源码 ⇒ 一并剔除（⚠️ 私有仓保留；副作用：`docs/compose/spec/` 里 3 处截图引用在公开仓成死链）。
 */
const FILTER_PATHS = ["cookies.txt", "cookies2.txt", "public/uploads", "backups", "content-export", "mobile-preview"];

/**
 * 用于**终检**的禁用路径 —— 刻意比 FILTER_PATHS 更严（多出 env 文件）。
 * 两者分开定义是本脚本的核心安全约束：清洗漏了什么，终检仍能独立发现。
 */
const AUDIT_FORBIDDEN = [...FILTER_PATHS, ".env", ".env.local", ".env.production", ".env.development"];

/** 公开仓库允许存在的 env 模板（唯一例外） */
const ENV_EXCEPTION = ".env.example";

const APPLY = process.argv.includes("--yes");

// ── 基础工具 ────────────────────────────────────────────────────────────
function git(args, opts = {}) {
  // 注意：不注入 -c http.proxy= —— 本机 push 依赖系统代理
  const out = execFileSync("git", args, {
    cwd: opts.cwd || REPO_DIR,
    encoding: "utf8",
    stdio: opts.quiet ? ["ignore", "pipe", "pipe"] : ["ignore", "inherit", "inherit"],
    timeout: 180_000,
  });
  return opts.quiet ? String(out ?? "").trim() : "";
}

function gitOut(args, cwd) {
  return git(args, { cwd, quiet: true });
}

function fatal(msg) {
  console.error(`\n  ✗ ${msg}`);
  process.exit(1);
}

function step(msg) {
  console.log(`\n== ${msg} ==`);
}

function isForbidden(p) {
  return AUDIT_FORBIDDEN.some((f) => {
    if (f.startsWith(".env")) {
      if (p === ENV_EXCEPTION) return false;
      return p === f || p.startsWith(f + ".");
    }
    return p === f || p.startsWith(f + "/");
  });
}

function remoteMainSha(url) {
  try {
    const out = gitOut(["ls-remote", url, "main"]);
    return out.split("\n")[0]?.split("\t")[0] || "";
  } catch {
    return "";
  }
}

// ── 主流程 ──────────────────────────────────────────────────────────────
function main() {
  console.log(`慢日志双仓发布 · ${APPLY ? "**实际推送**" : "DRY-RUN（不推送）"}`);

  // ① 前置：工作树必须干净 —— 否则"发布的到底是哪份代码"不可知
  step("① 前置检查");
  if (gitOut(["status", "--porcelain"])) {
    fatal("工作树不干净，请先提交（本脚本不会替你 commit）");
  }
  if (!fs.existsSync(path.join(REPO_DIR, BLUEPRINT))) {
    fatal(`缺少蓝图源文件 ${BLUEPRINT} —— 公开仓 README 依赖它，无法继续`);
  }
  const localHead = gitOut(["rev-parse", "HEAD"]);
  console.log(`  本地 HEAD = ${localHead.slice(0, 12)}`);
  if (!fs.existsSync(PY)) {
    fatal(`找不到 git-filter-repo 解释器：${PY}`);
  }

  // ② 私人仓（全量）推送 —— dry-run 时跳过
  step("② 私人仓 origin（含数据）");
  if (APPLY) {
    git(["push", "origin", "main"]);
    const o = remoteMainSha(ORIGIN);
    if (o !== localHead) fatal(`origin 校验失败：远端 ${o.slice(0, 12)} ≠ 本地 ${localHead.slice(0, 12)}`);
    console.log(`  ✓ origin = ${o.slice(0, 12)}`);
  } else {
    console.log("  (dry-run 跳过)");
  }

  // ③ 临时克隆
  step("③ 临时清洗克隆");
  fs.rmSync(TMP, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(TMP), { recursive: true });
  gitOut(["clone", "--no-local", REPO_DIR, TMP]);
  gitOut(["remote", "remove", "origin"], TMP);
  console.log(`  ✓ ${TMP}`);

  // ④ git-filter-repo 剔除数据路径
  step("④ 剔除数据路径（filter-repo）");
  console.log(`  路径：${FILTER_PATHS.join(" / ")}`);
  execFileSync(
    PY,
    ["-m", "git_filter_repo", "--invert-paths", ...FILTER_PATHS.flatMap((p) => ["--path", p]), "--force"],
    { cwd: TMP, stdio: "inherit", timeout: 600_000 }
  );

  // ⑤ 终检（一）：全历史 —— 旧版最大的漏洞在此，必须独立于 FILTER_PATHS
  step("⑤ 终检 · 全历史扫描");
  const histPaths = new Set(
    gitOut(["log", "--all", "--pretty=format:", "--name-only"], TMP)
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean)
  );
  const histBad = [...histPaths].filter(isForbidden);
  if (histBad.length) {
    fatal(`全历史仍含禁用路径，已中止：\n      ${histBad.join("\n      ")}`);
  }
  console.log(`  ✓ 全历史 ${histPaths.size} 个路径，0 命中`);

  // ⑥ 终检（二）：清洗后生成的树
  step("⑥ 终检 · 工作树扫描");
  const treePaths = gitOut(["ls-files"], TMP)
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  const treeBad = treePaths.filter(isForbidden);
  if (treeBad.length) {
    fatal(`工作树仍含禁用路径，已中止：\n      ${treeBad.join("\n      ")}`);
  }
  console.log(`  ✓ 工作树 ${treePaths.length} 个文件，0 命中`);

  // ⑦ 公开仓 README = 蓝图（源文件在仓内，可复现）
  step("⑦ 覆盖公开仓 README");
  fs.copyFileSync(path.join(TMP, BLUEPRINT), path.join(TMP, "README.md"));
  const readme = fs.readFileSync(path.join(TMP, "README.md"), "utf8");
  if (!/GPL-3\.0/.test(readme)) fatal("蓝图 README 未声明 GPL-3.0，疑似取错源文件");
  console.log(`  ✓ README = ${BLUEPRINT}（${readme.split("\n").length} 行）`);

  gitOut(["add", "-A"], TMP);
  if (gitOut(["status", "--porcelain"], TMP)) {
    git(["commit", "-m", "chore: 同步公开仓库（README = 设计蓝图）"], { cwd: TMP });
    console.log("  ✓ 已提交");
  } else {
    console.log("  · README 无变化，跳过提交");
  }

  // ⑧ 推送公开仓（显式租约强推）
  step("⑧ 公开仓 slowlog1");
  if (!APPLY) {
    console.log("  (dry-run 结束 —— 未推送任何远端)");
    fs.rmSync(TMP, { recursive: true, force: true });
    return;
  }
  const lease = remoteMainSha(PUBLIC);
  if (!lease) fatal("无法通过 ls-remote 取得公开仓 main 的 SHA，拒绝在无租约的情况下强推");
  const cleaned = gitOut(["rev-parse", "HEAD"], TMP);
  console.log(`  租约 main = ${lease.slice(0, 12)} → 目标 ${cleaned.slice(0, 12)}`);
  git(["push", `--force-with-lease=main:${lease}`, PUBLIC, "HEAD:main"], { cwd: TMP });

  const after = remoteMainSha(PUBLIC);
  if (after !== cleaned) {
    fatal(`公开仓校验失败：远端 ${after.slice(0, 12)} ≠ 本地清洗结果 ${cleaned.slice(0, 12)}`);
  }
  console.log(`  ✓ 公开仓 = ${after.slice(0, 12)}`);

  fs.rmSync(TMP, { recursive: true, force: true });
  console.log("\n== 双仓库同步完成 ==");
}

main();
