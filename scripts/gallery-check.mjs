import fs from "fs";
const h = fs.readFileSync("public/design/gallery.html", "utf8");
const n = (h.match(/\{id:"/g) || []).length;
console.log("entries", n);
console.log("CoverArt", h.includes("CoverArt 密拼贴"));
console.log("MTOC", h.includes("移动目录抽屉"));
console.log("P_BASE fade", h.includes("淡入"));
console.log("v1.5", h.includes("v1.5"));
