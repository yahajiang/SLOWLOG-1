#!/usr/bin/env node

/**
 * 自动版本号更新脚本
 * 根据 git diff 检测内容变化，自动 bump 版本号
 *
 * 用法：node scripts/auto-version.js
 * 触发：npm run precommit（通过 git hooks）
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const pkgPath = path.resolve(__dirname, "../package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
const [major, minor, patch] = pkg.version.split(".").map(Number);

// 检测变更类型
const diff = execSync("git diff --cached --name-only", { encoding: "utf-8" });
const files = diff.split("\n").filter(Boolean);

// 内容变更（文章、组件、页面）
const contentFiles = files.filter(
  (f) =>
    f.startsWith("app/") ||
    f.startsWith("components/") ||
    f.startsWith("lib/") ||
    f === "prisma/schema.prisma"
);

// 配置变更
const configFiles = files.filter(
  (f) =>
    f === "package.json" ||
    f === "next.config.mjs" ||
    f === "tsconfig.json" ||
    f.startsWith(".env")
);

// 严重变更（破坏性）
const breakingFiles = files.filter(
  (f) =>
    f === "package.json" ||
    f === "prisma/schema.prisma" ||
    f === "middleware.ts"
);

let newVersion;
let bumpType;

if (breakingFiles.length > 0) {
  // 破坏性变更 → major bump
  newVersion = `${major + 1}.0.0`;
  bumpType = "major";
} else if (contentFiles.length > 0) {
  // 内容变更 → minor bump
  newVersion = `${major}.${minor + 1}.0`;
  bumpType = "minor";
} else if (configFiles.length > 0) {
  // 配置变更 → patch bump
  newVersion = `${major}.${minor}.${patch + 1}`;
  bumpType = "patch";
} else {
  // 无相关变更
  process.exit(0);
}

// 更新版本号
pkg.version = newVersion;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

// 更新 README 版本历史
const readmePath = path.resolve(__dirname, "../README.md");
if (fs.existsSync(readmePath)) {
  let readme = fs.readFileSync(readmePath, "utf-8");
  const today = new Date().toISOString().slice(0, 7); // YYYY-MM
  const versionLine = `| ${newVersion} | ${today} | 自动更新 |`;

  // 在版本历史表格中插入新行
  const historyMarker = "| 版本 | 日期 | 更新内容 |";
  if (readme.includes(historyMarker)) {
    const lines = readme.split("\n");
    const idx = lines.findIndex((l) => l.trim() === historyMarker);
    if (idx >= 0) {
      // 找到下一个空行或表格结束
      let insertIdx = idx + 1;
      while (insertIdx < lines.length && lines[insertIdx].trim().startsWith("|")) {
        insertIdx++;
      }
      lines.splice(insertIdx, 0, versionLine);
      readme = lines.join("\n");
      fs.writeFileSync(readmePath, readme);
    }
  }
}

console.log(`Version bumped: ${pkg.version} (${bumpType})`);
