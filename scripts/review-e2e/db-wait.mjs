// 等待 PG 就绪并确保目标库存在（embedded-postgres 的 bin 不含 psql，故用 node 驱动）
import pg from "pg"

const PORT = Number(process.env.PG_PORT || 55432)
const DB = "slowlog"

async function tryConnect() {
  const client = new pg.Client({
    host: "127.0.0.1",
    port: PORT,
    user: "postgres",
    password: "postgres",
    database: "postgres",
    connectionTimeoutMillis: 3000,
  })
  await client.connect()
  return client
}

let admin = null
for (let i = 1; i <= 30; i++) {
  try {
    admin = await tryConnect()
    break
  } catch (e) {
    if (i === 30) {
      console.error(`  PG 连接失败（重试 ${i} 次）：${e.message}`)
      process.exit(1)
    }
    await new Promise((r) => setTimeout(r, 1000))
  }
}

const ver = await admin.query("SELECT current_setting('server_version') AS v")
console.log(`  PG 连接成功，版本 ${ver.rows[0].v}`)

const exists = await admin.query("SELECT 1 FROM pg_database WHERE datname = $1", [DB])
if (exists.rowCount === 0) {
  await admin.query(`CREATE DATABASE "${DB}"`)
  console.log(`  数据库 ${DB} 已创建`)
} else {
  console.log(`  数据库 ${DB} 已存在`)
}

await admin.end()
console.log("  DB_READY")
