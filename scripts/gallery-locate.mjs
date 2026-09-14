import fs from "fs";
import vm from "vm";
const h = fs.readFileSync("public/design/gallery.html", "utf8");
const m = h.match(/<script>([\s\S]*)<\/script>/);
if (!m) throw new Error("no script");
const code = m[1];
try {
  new vm.Script(code, { filename: "gallery.js" });
  console.log("script ok");
} catch (e) {
  console.log(e.message);
  const line = e.stack?.match(/gallery\.js:(\d+)/)?.[1];
  if (line) {
    const lines = code.split("\n");
    const n = +line;
    for (let i = Math.max(0, n - 3); i < Math.min(lines.length, n + 2); i++) {
      console.log(String(i + 1).padStart(4), lines[i].slice(0, 160));
    }
  }
}
