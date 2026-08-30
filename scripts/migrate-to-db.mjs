import fs from "fs";
import path from "path";
import matter from "gray-matter";

const postsDir = path.join(process.cwd(), "content", "posts");
const usersPath = path.join(process.cwd(), "data", "users.json");
const thoughtsPath = path.join(process.cwd(), "data", "thoughts.json");

async function main() {
  const { PrismaClient } = await import("@prisma/client");
  const { PrismaPg } = await import("@prisma/adapter-pg");
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  console.log("Migrating posts...");
  const files = fs.readdirSync(postsDir).filter((f) => f.endsWith(".md"));
  for (const file of files) {
    const id = file.replace(/\.md$/, "");
    const raw = fs.readFileSync(path.join(postsDir, file), "utf-8");
    const parsed = matter(raw);
    const d = parsed.data;
    const markdown = parsed.content.trim();
    await prisma.post.upsert({
      where: { id },
      update: {
        title: String(d.title ?? ""),
        titleZh: String(d.titleZh ?? d.title ?? ""),
        excerpt: String(d.excerpt ?? ""),
        excerptZh: String(d.excerptZh ?? d.excerpt ?? ""),
        category: String(d.category ?? "Design"),
        author: String(d.author ?? "Yahajiang"),
        authorInitial: String(d.authorInitial ?? "Y"),
        date: new Date(d.date ?? new Date().toISOString().slice(0, 10)),
        displayDate: String(d.displayDate ?? d.date ?? ""),
        readTime: String(d.readTime ?? "5 min"),
        featured: Boolean(d.featured),
        tags: Array.isArray(d.tags) ? d.tags : [],
        markdown,
        markdownZh: String(d.contentZh ?? markdown),
      },
      create: {
        id,
        title: String(d.title ?? ""),
        titleZh: String(d.titleZh ?? d.title ?? ""),
        excerpt: String(d.excerpt ?? ""),
        excerptZh: String(d.excerptZh ?? d.excerpt ?? ""),
        category: String(d.category ?? "Design"),
        author: String(d.author ?? "Yahajiang"),
        authorInitial: String(d.authorInitial ?? "Y"),
        date: new Date(d.date ?? new Date().toISOString().slice(0, 10)),
        displayDate: String(d.displayDate ?? d.date ?? ""),
        readTime: String(d.readTime ?? "5 min"),
        featured: Boolean(d.featured),
        tags: Array.isArray(d.tags) ? d.tags : [],
        markdown,
        markdownZh: String(d.contentZh ?? markdown),
      },
    });
    console.log("  upsert post:", id);
  }

  if (fs.existsSync(usersPath)) {
    console.log("Migrating users...");
    const db = JSON.parse(fs.readFileSync(usersPath, "utf-8"));
    for (const u of db.users || []) {
      await prisma.user.upsert({
        where: { username: u.username },
        update: { password: u.password, name: u.name, isDefault: !!u.isDefault },
        create: { username: u.username, password: u.password, name: u.name, isDefault: !!u.isDefault },
      });
      console.log("  upsert user:", u.username);
    }
  }

  if (fs.existsSync(thoughtsPath)) {
    console.log("Migrating thoughts...");
    const db = JSON.parse(fs.readFileSync(thoughtsPath, "utf-8"));
    for (const t of db.thoughts || []) {
      await prisma.thought.upsert({
        where: { id: t.id },
        update: { text: t.text, textZh: t.textZh, time: t.time, timeZh: t.timeZh },
        create: { id: t.id, text: t.text, textZh: t.textZh, time: t.time, timeZh: t.timeZh },
      });
      console.log("  upsert thought:", t.id);
    }
  }

  console.log("Done.");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
