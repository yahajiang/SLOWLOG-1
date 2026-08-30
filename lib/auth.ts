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

interface DB {
  users: User[];
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

export async function verifyUser(
  username: string,
  password: string
): Promise<{ success: boolean; name?: string; isDefault?: boolean; error?: string }> {
  const db = readDB();
  const user = db.users.find((u) => u.username === username);
  if (!user) return { success: false, error: "用户不存在" };
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return { success: false, error: "密码错误" };
  return { success: true, name: user.name, isDefault: user.isDefault };
}

export async function getUser(username: string): Promise<User | undefined> {
  const db = readDB();
  return db.users.find((u) => u.username === username);
}

export async function updateUser(
  username: string,
  updates: { username?: string; password?: string; name?: string }
): Promise<{ success: boolean; error?: string }> {
  const db = readDB();
  const userIndex = db.users.findIndex((u) => u.username === username);
  if (userIndex === -1) return { success: false, error: "用户不存在" };
  if (updates.username && updates.username !== username) {
    if (db.users.find((u) => u.username === updates.username)) return { success: false, error: "用户名已存在" };
  }
  if (updates.username) db.users[userIndex].username = updates.username;
  if (updates.name) db.users[userIndex].name = updates.name;
  if (updates.password) {
    const salt = await bcrypt.genSalt(10);
    db.users[userIndex].password = await bcrypt.hash(updates.password, salt);
  }
  db.users[userIndex].isDefault = false;
  writeDB(db);
  return { success: true };
}

export async function createUser(
  username: string,
  password: string,
  name: string
): Promise<{ success: boolean; error?: string }> {
  const db = readDB();
  if (db.users.find((u) => u.username === username)) return { success: false, error: "用户名已存在" };
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  db.users.push({ username, password: hash, name, isDefault: false });
  writeDB(db);
  return { success: true };
}
