import fs from "fs";
const path = "public/design/gallery.html";
let h = fs.readFileSync(path, "utf8");
h = h.replace(
  "function openAbout(){\n  document.getElementById(\"m-body\").innerHTML=`\n    <h2 class=\"m-h2\">设计蓝图 · 慢日志 UI</h2>\n    <div class=\"m-meta\"><span class=\"tag\">DESIGN.md v1.6</span>",
  "function openAbout(){\n  var md=document.querySelector(\".modal\");\n  if(md) md.classList.add(\"about\");\n  document.getElementById(\"m-body\").innerHTML=`\n    <div class=\"m-meta\" style=\"margin-bottom:14px\"><span class=\"tag\">DESIGN.md v1.6</span>"
);
// if first replace failed try unix
if (!h.includes('md.classList.add("about")')) {
  h = h.replace(
    /function openAbout\(\)\{\r?\n  document\.getElementById\("m-body"\)\.innerHTML=`\r?\n    <h2 class="m-h2">设计蓝图/,
    'function openAbout(){\r\n  var md=document.querySelector(".modal");\r\n  if(md) md.classList.add("about");\r\n  document.getElementById("m-body").innerHTML=`\r\n    <h2 class="m-h2">设计蓝图'
  );
}
h = h.replace(
  'function closeM(){var m=document.getElementById("mask");m.classList.add("closing");setTimeout(function(){m.classList.remove("open","closing");document.body.style.overflow=""},200)}',
  'function closeM(){var m=document.getElementById("mask");var md=document.querySelector(".modal");if(md)md.classList.remove("about");m.classList.add("closing");setTimeout(function(){m.classList.remove("open","closing");document.body.style.overflow=""},280)}'
);
fs.writeFileSync(path, h);
console.log("about class", h.includes('classList.add("about")'));
console.log("close 280", h.includes("},280)}"));
