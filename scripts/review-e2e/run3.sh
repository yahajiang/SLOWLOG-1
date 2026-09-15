#!/usr/bin/env bash
# 端到端功能测试编排 v3（审查用 · 最终版）
#
# ── 环境结论（均已实测确证）──────────────────────────────────────
# ① Windows 下 PostgreSQL 的 initdb 会因**二进制所在路径含非 ASCII 字符**而失败：
#      performing post-bootstrap initialization ...
#      FATAL: invalid byte sequence for encoding "UTF8": 0xc2 0xfd
#    与「控制台代码页 936」无关（chcp 65001 实测无效），也与数据目录路径无关。
#    必须让 PG 二进制落在纯 ASCII 路径（本脚本用 C:/pgtest/native）。
# ② embedded-postgres 的 native/bin 只含服务端二进制（initdb/pg_ctl/postgres），
#    **没有 psql/createdb/pg_isready** → 建库与健康检查改用 node + pg 驱动。
# ③ `pg_ctl start` 的输出必须整份重定向到文件：postgres 子进程会继承 stdout，
#    若接管道（| tail）则管道永不关闭，脚本永久挂起。
set -u
export PATH="/c/Users/Yahajiang/.workbuddy/binaries/node/versions/22.22.2-3:/usr/bin:/bin:$PATH"
cd "C:/Users/Yahajiang/WorkBuddy/Worktrees/慢日志/main-d1409eb1" || exit 1

PG_BIN="${PG_BIN:-/c/pgtest/native/bin}"
PG_DATA="${PG_DATA:-C:/pgtest/data}"
PG_PORT=55432
LOG="C:/Users/Yahajiang/AppData/Local/Temp/slowlog-e2e"
mkdir -p "$LOG"

export PG_PORT
export DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:${PG_PORT}/slowlog"
export AUTH_SECRET="ci-e2e-secret-0123456789abcdef"
export NEXTAUTH_URL="http://127.0.0.1:3101"
export NEXT_PUBLIC_SITE_URL="http://127.0.0.1:3101"
export BLOB_READ_WRITE_TOKEN=""

echo "===== [1/6] 启动 PostgreSQL ====="
"$PG_BIN/pg_ctl.exe" -D "$PG_DATA" -o "-p $PG_PORT" -l "$LOG/pg.log" start > "$LOG/pgctl.out" 2>&1
echo "  pg_ctl 退出码=$? （输出见 $LOG/pgctl.out）"
node scripts/review-e2e/db-wait.mjs 2>&1

echo "===== [2/6] prisma db push（建表）====="
npx prisma db push --skip-generate 2>&1 | tail -6

echo "===== [3/6] 种子数据 + 测试账户 ====="
npx tsx prisma/seed.ts 2>&1 | tail -6
node scripts/api-tests-fixtures.mjs 2>&1 | tail -6

echo "===== [4/6] 启动生产服务（port 3101）====="
npx next start -p 3101 > "$LOG/app.log" 2>&1 &
APP_PID=$!
READY=0
code=""
for i in $(seq 1 60); do
  code=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:3101/api/health" 2>/dev/null)
  if [ "$code" = "200" ]; then READY=1; break; fi
  sleep 1
done
echo "  服务就绪=$READY （/api/health HTTP $code）"
if [ "$READY" != "1" ]; then tail -20 "$LOG/app.log"; fi

echo ""
echo "===== [5/6] 项目自带 API 集成测试（6 场景）====="
node scripts/api-tests.mjs http://127.0.0.1:3101 2>&1

echo ""
echo "===== [6/6] 审查补充测试（修复后应全部通过）====="
node scripts/review-e2e/extra-tests.mjs http://127.0.0.1:3101 2>&1

echo ""
echo "===== 清理 ====="
kill $APP_PID 2>/dev/null || true
"$PG_BIN/pg_ctl.exe" -D "$PG_DATA" stop -m fast > "$LOG/pgstop.out" 2>&1
echo "  PG 已停止"
echo "E2E_DONE"
