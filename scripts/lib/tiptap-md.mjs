// Tiptap JSON ↔ Markdown 双向转换器（内容资产保险，v0.3 P2）
// 覆盖（双向无损）：标题/段落/粗斜下删/行内码/高亮/文字颜色/链接/图片/引用/
//   有序无序列表/任务列表/表格/代码块(带语言)/分隔线/硬换行/段落与标题对齐。
//
// 扩展语法（本文件自定义，导出时反向生成同样形式）：
//   对齐   {.center} 文本   → paragraph/heading.attrs.textAlign = "center"
//          {.right} / {.justify} 同理；{ .left } 为默认，不写
//   表格   GFM 管道表格（首行表头 + |---| 分隔行），单元格内联语法可用
//   任务   - [ ] 待办   /   - [x] 已完成
// 不支持的结构降级为纯文本段落。纯 JS（.mjs 脚本专用，无类型注解）。

/* ============ 行内：Tiptap → Markdown ============ */

function inlineToMd(node) {
  if (!node) return "";
  if (Array.isArray(node)) return node.map(inlineToMd).join("");
  if (typeof node !== "object") return "";
  if (typeof node.text === "string") {
    // 行内格式挂在 text 节点的 marks 上（不是包裹节点），必须在这里应用——
    // 早期版本直接返回纯文本，导致导出链路静默丢掉全部行内格式。
    const marks = node.marks || [];
    const has = (t) => marks.some((m) => m.type === t);
    if (has("code")) {
      const raw = node.text;
      const fence = raw.includes("`") ? "``" : "`";
      return `${fence}${raw}${fence}`;
    }
    let t = node.text.replace(/([\\`*_{}\[\]()#!|<>])/g, "\\$1");
    if (has("bold")) t = `**${t}**`;
    if (has("italic")) t = `*${t}*`;
    if (has("strike")) t = `~~${t}~~`;
    if (has("underline")) t = `<u>${t}</u>`;
    if (has("highlight")) t = `<mark>${t}</mark>`;
    const st = marks.find((m) => m.type === "textStyle" && m.attrs && m.attrs.color);
    if (st) t = `<span style="color:${st.attrs.color}">${t}</span>`;
    const lk = marks.find((m) => m.type === "link" && m.attrs && m.attrs.href);
    if (lk) t = `[${t}](${lk.attrs.href})`;
    return t;
  }
  if (node.type === "hardBreak") return "  \n";
  const inner = inlineToMd(node.content);
  switch (node.type) {
    case "bold": return `**${inner}**`;
    case "italic": return `*${inner}*`;
    case "strike": return `~~${inner}~~`;
    case "code": {
      const raw = (node.content || []).map((c) => c.text || "").join("");
      const fence = raw.includes("`") ? "``" : "`";
      return `${fence}${raw}${fence}`;
    }
    case "underline": return `<u>${inner}</u>`;
    case "highlight": return `<mark>${inner}</mark>`;
    case "link": return `[${inner}](${(node.attrs && node.attrs.href) || ""})`;
    case "textStyle": {
      const c = node.attrs && node.attrs.color;
      return c ? `<span style="color:${c}">${inner}</span>` : inner;
    }
    default: return inner;
  }
}

/* ============ 块级：Tiptap → Markdown ============ */

const ALIGN_ATTRS = ["center", "right", "justify"];
const alignPrefix = (n) =>
  n.attrs && ALIGN_ATTRS.includes(n.attrs.textAlign) ? `{.${n.attrs.textAlign}} ` : "";

export function tiptapToMarkdown(doc) {
  const out = [];
  function cellText(cell) {
    return (cell.content || []).map((p) => (p.content || []).map(inlineToMd).join("")).join(" ").replace(/\n/g, " ").trim();
  }
  function blocks(list) {
    for (const n of list) {
      const inner = (n.content || []).map(inlineToMd).join("");
      switch (n.type) {
        case "heading": {
          const lv = Math.min(Math.max((n.attrs && n.attrs.level) || 2, 1), 6);
          out.push(`${alignPrefix(n)}${"#".repeat(lv)} ${inner}`, "");
          break;
        }
        case "paragraph":
          out.push(alignPrefix(n) + (inner || ""), "");
          break;
        case "codeBlock": {
          const lang = (n.attrs && n.attrs.language) || "";
          const code = (n.content || []).map((c) => c.text || "").join("\n");
          out.push("```" + lang, code, "```", "");
          break;
        }
        case "blockquote": {
          // 逐段导出：早期用 inner 拼接会把多段引用挤成一行
          const paras = (n.content || []).map((p) => (p.content || []).map(inlineToMd).join(""));
          out.push(...paras.map((p) => `> ${p}`), "");
          break;
        }
        case "bulletList":
          for (const li of n.content || []) {
            const text = (li.content || []).map(inlineToMd).join(" ").replace(/\n/g, " ");
            out.push(`- ${text}`);
          }
          out.push("");
          break;
        case "orderedList":
          (n.content || []).forEach((li, i) => {
            const text = (li.content || []).map(inlineToMd).join(" ").replace(/\n/g, " ");
            out.push(`${i + 1}. ${text}`);
          });
          out.push("");
          break;
        case "taskList":
          for (const li of n.content || []) {
            const text = (li.content || []).map(inlineToMd).join(" ").replace(/\n/g, " ");
            out.push(`- [${(li.attrs && li.attrs.checked) ? "x" : " "}] ${text}`);
          }
          out.push("");
          break;
        case "table": {
          const rows = n.content || [];
          rows.forEach((row, ri) => {
            const cells = (row.content || []).map(cellText);
            out.push(`| ${cells.join(" | ")} |`);
            if (ri === 0) out.push(`| ${cells.map(() => "---").join(" | ")} |`);
          });
          out.push("");
          break;
        }
        case "image":
          out.push(`![${(n.attrs && n.attrs.alt) || ""}](${(n.attrs && n.attrs.src) || ""})`, "");
          break;
        case "horizontalRule":
          out.push("---", "");
          break;
        default:
          if (n.content) blocks(n.content);  // 未知块级：递归子节点（避免自我递归栈溢出）
          break;
      }
    }
  }
  if (doc && doc.content) blocks(doc.content);
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

/* ============ 行内：Markdown → Tiptap ============ */

const INLINE_RE = new RegExp(
  [
    "\\*\\*([^*]+)\\*\\*",                              // 1 bold
    "\\*([^*]+)\\*",                                    // 2 italic
    "`([^`]+)`",                                        // 3 code
    "~~([^~]+)~~",                                      // 4 strike
    "<u>([^<]*)</u>",                                   // 5 underline
    "<mark>([^<]*)</mark>",                             // 6 highlight
    "<span style=\"color:([^\"]+)\">([^<]*)</span>",    // 7 color, 8 text
    "(!?\\[[^\\]]*\\]\\([^)]+\\))",                     // 9 link/image
  ].join("|"),
  "g",
);

function inlineMdToNodes(text) {
  if (!text.trim()) return [];
  const nodes = [];
  let last = 0;
  let m;
  let plainBuf = "";

  const flush = () => {
    const t = plainBuf.replace(/\\([\\`*_{}\[\]()#!|<>])/g, "$1");
    if (t) nodes.push({ type: "text", text: t });
    plainBuf = "";
  };
  const mark = (type, value, attrs) => {
    flush();
    nodes.push({ type: "text", marks: [attrs ? { type, attrs } : { type }], text: value });
  };

  while ((m = INLINE_RE.exec(text))) {
    plainBuf += text.slice(last, m.index);
    last = m.index + m[0].length;
    if (m[1] !== undefined) mark("bold", m[1]);
    else if (m[2] !== undefined) mark("italic", m[2]);
    else if (m[3] !== undefined) mark("code", m[3]);
    else if (m[4] !== undefined) mark("strike", m[4]);
    else if (m[5] !== undefined) mark("underline", m[5]);
    else if (m[6] !== undefined) mark("highlight", m[6]);
    else if (m[7] !== undefined) mark("textStyle", m[8], { color: m[7] });
    else if (m[9]) {
      const im = /^!?\[([^\]]*)\]\(([^)]+)\)$/.exec(m[9]);
      if (im) {
        flush();
        if (m[9].startsWith("!")) nodes.push({ type: "image", attrs: { src: im[2], alt: im[1] || "" } });
        else mark("link", im[1], { href: im[2] });
      } else plainBuf += m[9];
    } else plainBuf += m[0];
  }
  plainBuf += text.slice(last);
  flush();
  if (!nodes.length) nodes.push({ type: "text", text: "" });
  return nodes;
}

function mdPara(text, align) {
  const node = { type: "paragraph", content: inlineMdToNodes(text) };
  if (align) node.attrs = { textAlign: align };
  return node;
}

/* ============ 块级：Markdown → Tiptap ============ */

const ALIGN_RE = /^\{\.(left|center|right|justify)\}\s*/;

function splitRow(line) {
  return line.replace(/^\s*\|/, "").replace(/\|\s*$/, "").split("|").map((c) => c.trim());
}
const isSepRow = (line) => /^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(line) && line.includes("-");

export function markdownToTiptap(md) {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const content = [];
  let i = 0;
  let inCode = false;
  let codeLang = "";
  let codeBuf = [];
  let listBuf = null;
  let soft = false;   // 上一行是否为「可软换行续接」的普通文本行

  const flushList = () => {
    if (!listBuf) return;
    content.push({
      type: listBuf.type,
      content: listBuf.items.map((it) =>
        listBuf.type === "taskList"
          ? { type: "taskItem", attrs: { checked: !!it.checked }, content: [mdPara(it.text)] }
          : { type: "listItem", content: [mdPara(it.text)] },
      ),
    });
    listBuf = null;
  };

  while (i < lines.length) {
    let line = lines[i];
    const wasSoft = soft;
    soft = false;

    if (line.startsWith("```")) {
      flushList();
      if (inCode) {
        content.push({ type: "codeBlock", attrs: { language: codeLang }, content: [{ type: "text", text: codeBuf.join("\n") }] });
        inCode = false; codeBuf = [];
      } else { inCode = true; codeLang = line.slice(3).trim(); codeBuf = [] }
      i++; continue;
    }
    if (inCode) { codeBuf.push(line); i++; continue; }

    // 对齐指令（行首 {.center} 等）
    let align = null;
    const am = ALIGN_RE.exec(line);
    if (am) { align = am[1] === "left" ? null : am[1]; line = line.slice(am[0].length); }

    // 表格：本行是管道行且下一行是分隔行
    if (line.trim().startsWith("|") && isSepRow(lines[i + 1] || "")) {
      flushList();
      const rows = [];
      const header = splitRow(line);
      i += 2;
      while (i < lines.length && lines[i].trim().startsWith("|")) { rows.push(splitRow(lines[i])); i++; }
      const mkCell = (txt, isHead) => ({
        type: isHead ? "tableHeader" : "tableCell",
        content: [mdPara(txt)],
      });
      const tableRows = [{ type: "tableRow", content: header.map((c) => mkCell(c, true)) }];
      for (const r of rows) {
        const cells = r.length < header.length ? [...r, ...Array(header.length - r.length).fill("")] : r.slice(0, header.length);
        tableRows.push({ type: "tableRow", content: cells.map((c) => mkCell(c, false)) });
      }
      content.push({ type: "table", content: tableRows });
      continue;
    }

    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h) {
      flushList();
      const node = { type: "heading", attrs: { level: h[1].length }, content: inlineMdToNodes(h[2]) };
      if (align) node.attrs.textAlign = align;
      content.push(node); i++; continue;
    }

    if (/^---+\s*$/.test(line)) { flushList(); content.push({ type: "horizontalRule" }); i++; continue }

    const img = /^!\[([^\]]*)\]\(([^)]+)\)\s*$/.exec(line);
    if (img) { flushList(); content.push({ type: "image", attrs: { src: img[2], alt: img[1] } }); i++; continue }

    const task = /^[-*]\s+\[([ xX])\]\s+(.*)$/.exec(line);
    if (task) {
      if (!listBuf || listBuf.type !== "taskList") { flushList(); listBuf = { type: "taskList", items: [] } }
      listBuf.items.push({ checked: task[1].toLowerCase() === "x", text: task[2] });
      i++; continue;
    }

    const ul = /^[-*]\s+(.*)$/.exec(line);
    if (ul) {
      if (!listBuf || listBuf.type !== "bulletList") { flushList(); listBuf = { type: "bulletList", items: [] } }
      listBuf.items.push({ text: ul[1] }); i++; continue;
    }

    const ol = /^\d+[.)]\s+(.*)$/.exec(line);
    if (ol) {
      if (!listBuf || listBuf.type !== "orderedList") { flushList(); listBuf = { type: "orderedList", items: [] } }
      listBuf.items.push({ text: ol[1] }); i++; continue;
    }

    const bq = /^>\s?(.*)$/.exec(line);
    if (bq) {
      flushList();
      const prev = content[content.length - 1];
      if (prev && prev.type === "blockquote") prev.content.push(mdPara(bq[1]));
      else content.push({ type: "blockquote", content: [mdPara(bq[1])] });
      i++; continue;
    }

    if (!line.trim()) { flushList(); i++; continue }

    flushList();
    const prev = content[content.length - 1];
    // 只有「上一行也是普通文本行」（软换行续接）才并入上一段；空行或其他块之后必须另起一段。
    // 早期漏了这个判断：只检查上一个节点是不是段落，于是空行分隔的段落被整段并成一段，
    // 并且并进去的内容是以纯文本拼接的——行内标记（粗体/链接/删除线…）全被吞掉。
    if (wasSoft && prev && prev.type === "paragraph" && !align && !(prev.attrs && prev.attrs.textAlign)) {
      const tail = prev.content[prev.content.length - 1];
      if (tail && typeof tail.text === "string") tail.text += " " + line.trim();
      else prev.content.push(...inlineMdToNodes(line.trim()));
    } else {
      content.push(mdPara(line.trim(), align));
    }
    soft = true;
    i++;
  }
  flushList();
  if (inCode) content.push({ type: "codeBlock", attrs: { language: codeLang }, content: [{ type: "text", text: codeBuf.join("\n") }] });

  return { type: "doc", content: content.length ? content : [{ type: "paragraph", content: [{ type: "text", text: "" }] }] };
}
