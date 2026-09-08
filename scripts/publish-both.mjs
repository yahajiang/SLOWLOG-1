#!/usr/bin/env node
// 双仓库推送（v0.3 技术债固化）：私人全量 + 公开清洗，一条命令完成并验证。
// 用法：node scripts/publish-both.mjs
// 前置：工作树干净（自行 commit）；本网络直连 github.com 稳定（代理关闭时最稳）。
import { execSync } from "node:child_process";

const REPO_DIR = "C:/Users/Yahajiang/Desktop/AstrBot插件/慢日志";
const ORIGIN = "https://github.com/yahajiang/slowlog.git";
const PUBLIC = "https://github.com/yahajiang/SLOWLOG-1.git";
const TMP = "C:/Users/Yahajiang/AppData/Local/Temp/slowlog1-clean";
const STRIP = ["cookies2.txt", "public/uploads"]; // 公开仓库剔除的数据路径
const PY = "C:/Users/Yahajiang/.workbuddy/binaries/python/envs/default/Scripts/python.exe"; // git-filter-repo 是 python 模块
const GIT = ["-c", "http.proxy=", "-c", "https.proxy="]; // 本网络直连更稳（代理 7890 常关）

function git(args, opts = {}) {
  const out = execSync(`git ${GIT.join(" ")} ${args}`, { cwd: opts.cwd || REPO_DIR, encoding: "utf8", stdio: opts.quiet ? "pipe" : "inherit", timeout: 180000 });
  return opts.quiet ? String(out ?? "").trim() : "";
}
function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
function head(repoDir) {
  try { return git("rev-parse HEAD", { cwd: repoDir, quiet: true }).slice(0, 12) } catch { return "" }
}
function remoteHead(url) {
  try { return git(`ls-remote ${url} main`, { quiet: true }).split("\t")[0].slice(0, 12) } catch { return "" }
}

async function verify(url, localHead, tries = 4) {
  for (let i = 0; i < tries; i++) {
    const r = remoteHead(url);
    if (r) {
      if (r === localHead) { console.log(`  ✓ verified remote=${r}`); return true }
      console.log(`  ✗ mismatch remote=${r} local=${localHead}`); return false;
    }
    console.log(`  … ls-retry ${i + 1} (network)`);
    await sleep(8000);
  }
  console.log("  ✗ ls-remote unreachable");
  return false;
}

async function main() {
  console.log("== ① 私人仓库（全量） ==");
  const local = head(REPO_DIR);
  let oPushed = false;
  for (let i = 1; i <= 6 && !oPushed; i++) {
    try { console.log("  " + (git("push origin main", { quiet: true }) || "pushed")); oPushed = true }
    catch (e) { console.log("  " + String(e.message).split("\n")[0].slice(0, 100)); await sleep(i * 8000) }
  }
  if (!oPushed) { console.error("  ✗ origin push failed after retries"); process.exit(1) }
  if (!(await verify(ORIGIN, local))) process.exit(1);

  console.log("== ② 公开仓库（清洗） ==");
  execSync(`node -e "require('fs').rmSync('${TMP.replace(/\\/g, "/")}', { recursive: true, force: true })"`);
  git(`clone --no-local . "${TMP}"`);
  git("remote remove origin", { cwd: TMP, quiet: true });
  execSync(`"${PY}" -m git_filter_repo --invert-paths ${STRIP.map((p) => `--path ${p}`).join(" ")} --force`, { cwd: TMP, stdio: "pipe" });
  git("remote add slowlog1 " + PUBLIC, { cwd: TMP, quiet: true });

  // fetch+merge+push 带退避重试（本网络对 github 间歇阻断，实测多轮内必有窗口）
  let pushed = false;
  for (let i = 1; i <= 6 && !pushed; i++) {
    console.log(`  … attempt ${i}`);
    try {
      git("fetch slowlog1 main", { cwd: TMP, quiet: true });
      git("merge -X ours slowlog1/main -m \"merge: 并入远程 README 蓝图与 LICENSE\"", { cwd: TMP, quiet: true });
      const p = git("push slowlog1 main", { cwd: TMP, quiet: true });
      console.log("  " + (p || "pushed"));
      pushed = true;
    } catch (e) {
      console.log("  " + String(e.message).split("\n")[0].slice(0, 100));
      await sleep(i * 8000);
    }
  }
  if (!pushed) { console.error("  ✗ push failed after retries"); process.exit(1) }

  // 数据残留终检
  const leaked = execSync(`git ls-tree -r --name-only slowlog1/main`, { cwd: TMP, encoding: "utf8" })
    .split("\n").filter((f) => STRIP.some((p) => f.startsWith(p)));
  if (leaked.length) { console.error("  ✗ 数据残留！", leaked); process.exit(1) }
  console.log(`  ✓ 零残留（${execSync("git ls-tree -r --name-only slowlog1/main", { cwd: TMP, encoding: "utf8" }).split("\n").filter(Boolean).length} 文件）`);

  const cleaned = head(TMP);
  if (!(await verify(PUBLIC, cleaned))) process.exit(1);

  console.log("\n== 双仓库同步完成 ==");
  execSync(`node -e "require('fs').rmSync('${TMP.replace(/\\/g, "/")}', { recursive: true, force: true })"`);
}

main().catch((e) => { console.error("[publish-both] failed:", e.message); process.exit(1) });
