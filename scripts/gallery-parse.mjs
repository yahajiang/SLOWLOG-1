import fs from "fs";
import vm from "vm";
const h = fs.readFileSync("public/design/gallery.html", "utf8");
const start = h.indexOf("const P_BASE");
const end = h.indexOf("const CATS");
if (start < 0 || end < 0) throw new Error("markers missing");
const js = h.slice(start, end) + "\n;({ n: C.length, hasCover: C.some(c=>c.id==='cover'), hasMtoc: C.some(c=>c.id==='mtoc') })";
// strip template issues - just eval in vm with mock
try {
  const ctx = { console };
  vm.createContext(ctx);
  const r = vm.runInContext(js + "; C", ctx);
  console.log("ok entries", Array.isArray(r) ? r.length : r);
} catch (e) {
  console.error("SYNTAX", e.message);
  process.exit(1);
}
