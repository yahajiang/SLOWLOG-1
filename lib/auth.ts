import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { createToken, verifyToken } from "./jwt";

const DB_PATH = path.join(process.cwd(), "data", "users.json");

interface User {
  username: string;
  password: string;
  name: string;
  isDefault?: boolean;
}
interface DB { users: User[]; }

function hasDatabase(): boolean {
  return !!(
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.NEON_DATABASE_URL
  );
}

function readDB(): DB {
  try {
    if (!fs.existsSync(DB_PATH)) return { users: [] };
    const raw = fs.readFileSync(DB_PATH, "utf-8");
    return JSON.parse(raw) as DB;
  } catch (error) {
    console.error("Failed to read users database:", error);
    return { users: [] };
  }
}
function writeDB(db: DB): void {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
}
export { createToken, verifyToken };
export async function verifyUser(username: string, password: string): Promise<{ success: boolean; name?: string; isDefault?: boolean; error?: string }> {
  if (hasDatabase()) {
    try {
      const { prisma } = await import("./prisma");
      const user = await prisma.user.findUnique({ where: { username } });
      if (user) {
        const valid = await bcrypt.compare(password, user.password);
        if (valid) return { success: true, name: user.name, isDefault: user.isDefault };
        return { success: false, error: "密码错误" };
      }
    } catch (e) { console.warn("[auth] DB fallback", e); }
  }
  const db = readDB();
  const user = db.users.find((u) => u.username === username);
  if (!user) return { success: false, error: "用户不存在" };
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return { success: false, error: "密码错误" };
  return { success: true, name: user.name, isDefault: user.isDefault };
}
export async function getUser(username: string): Promise<User | undefined> {
  if (hasDatabase()) {
    try {
      const { prisma } = await import("./prisma");
      const u = await prisma.user.findUnique({ where: { username } });
      if (u) return { username: u.username, password: u.password, name: u.name, isDefault: u.isDefault };
    } catch {}
  }
  const db = readDB();
  return db.users.find((u) => u.username === username);
}
export async function updateUser(username: string, updates: { username?: string; password?: string; name?: string }): Promise<{ success: boolean; error?: string }> {
  if (hasDatabase()) {
    try {
      const { prisma } = await import("./prisma");
      const existing = await prisma.user.findUnique({ where: { username } });
      if (existing) {
        if (updates.username && updates.username !== username) {
          const dup = await prisma.user.findUnique({ where: { username: updates.username } });
          if (dup) return { success: false, error: "用户名已存在" };
        }
        const data: any = { isDefault: false };
        if (updates.username) data.username = updates.username;
        if (updates.name) data.name = updates.name;
        if (updates.password) { const salt = await bcrypt.genSalt(10); data.password = await bcrypt.hash(updates.password, salt); }
        await prisma.user.update({ where: { username }, data });
        return { success: true };
      }
    } catch (e) { console.warn("[auth] DB update fallback", e); }
  }
  const db = readDB();
  const idx = db.users.findIndex((u) => u.username === username);
  if (idx === -1) return { success: false, error: "用户不存在" };
  if (updates.username && updates.username !== username) {
    if (db.users.find((u) => u.username === updates.username)) return { success: false, error: "用户名已存在" };
  }
  if (updates.username) db.users[idx].username = updates.username;
  if (updates.name) db.users[idx].name = updates.name;
  if (updates.password) { const salt = await bcrypt.genSalt(10); db.users[idx].password = await bcrypt.hash(updates.password, salt); }
  db.users[idx].isDefault = false;
  writeDB(db);
  return { success: true };
}
export async function createUser(username: string, password: string, name: string): Promise<{ success: boolean; error?: string }> {
  if (hasDatabase()) {
    try {
      const { prisma } = await import("./prisma");
      const dup = await prisma.user.findUnique({ where: { username } });
      if (dup) return { success: false, error: "用户名已存在" };
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);
      await prisma.user.create({ data: { username, password: hash, name, isDefault: false } });
      return { success: true };
    } catch {}
  }
  const db = readDB();
  if (db.users.find((u) => u.username === username)) return { success: false, error: "用户名已存在" };
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  db.users.push({ username, password: hash, name, isDefault: false });
  writeDB(db);
  return { success: true };
}
