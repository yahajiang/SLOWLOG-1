import { execSync } from "child_process";

if (process.env.DATABASE_URL) {
  try {
    console.log("[db-push] Syncing schema to database...");
    execSync("npx prisma db push", { stdio: "inherit" });
    console.log("[db-push] Schema synced.");
  } catch (e) {
    console.warn("[db-push] Failed to sync schema:", e.message);
  }
} else {
  console.log("[db-push] No DATABASE_URL, skipping.");
}

console.log("[build] Running next build...");
execSync("npx next build", { stdio: "inherit" });
