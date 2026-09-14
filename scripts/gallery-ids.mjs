import fs from "fs";
const h = fs.readFileSync("public/design/gallery.html", "utf8");
const ids = [...h.matchAll(/\{id:"([^"]+)",name:"([^"]+)"/g)].map((m) => `${m[1]} ${m[2]}`);
console.log(ids.join("\n"));
console.log("---", ids.length);
