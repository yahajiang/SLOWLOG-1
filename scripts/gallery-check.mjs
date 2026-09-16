import fs from "fs";
const h = fs.readFileSync("public/design/gallery.html", "utf8");
const n = (h.match(/\{id:"/g) || []).length;
console.log("entries", n);
console.log("CoverArt", h.includes("CoverArt 密拼贴"));
console.log("MTOC", h.includes("移动目录抽屉"));
console.log("P_BASE fade", h.includes("淡入"));
console.log("v1.8", h.includes("v1.8"));
// v1.8 新增条目
for (const id of ["tablet-gate", "desktop-escape", "loading-scope", "settings-form", "pagination-20", "rss-feed", "tablet-tree", "seo-canonical", "home-group-8"]) {
  console.log(id, h.includes(`{id:"${id}"`));
}
// v1.8 修复断言：后台五 Tab / 侧栏折叠 / 单页 20 / 首页内过滤
console.log("mdash-5", h.includes("repeat(5,1fr)"));
console.log("sidebar-fold", h.includes("68px"));
console.log("page-20", h.includes("FRONT_PAGE_SIZE_MAX=20"));
console.log("home-filter", h.includes("showAllInCategory"));
if (n !== 58) { console.error(`entries expected 58, got ${n}`); process.exit(1); }
