// Tiptap JSON ↔ Markdown 双向转换器（内容资产保险，v0.3 P2）
// 覆盖：标题/段落/粗斜下删/行内码/高亮/链接/图片/引用/有序无序列表/
//       代码块(带语言)/分隔线/硬换行。不支持的结构降级为纯文本段落。
// 纯 JS（.mjs 脚本专用，无类型注解）。

/* ============ Tiptap JSON → Markdown ============ */

function inlineToMd(node) {
  if (!node) return "";
  if (Array.isArray(node)) return node.map(inlineToMd).join("");
  if (typeof node !== "object") return "";
  if (typeof node.text === "string") {
    return node.text.replace(/([\\`*_{}\[\]()#!|<>])/g, "\\$1");
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

export function tiptapToMarkdown(doc) {
  const out = [];
  function blocks(list) {
    for (const n of list) {
      const inner = (n.content || []).map(inlineToMd).join("");
      switch (n.type) {
        case "heading": {
          const lv = Math.min(Math.max((n.attrs && n.attrs.level) || 2, 1), 6);
          out.push(`${"#".repeat(lv)} ${inner}`, "");
          break;
        }
        case "paragraph":
          out.push(inner || "", "");
          break;
        case "codeBlock": {
          const lang = (n.attrs && n.attrs.language) || "";
          const code = (n.content || []).map((c) => c.text || "").join("\n");
          out.push("```" + lang, code, "```", "");
          break;
        }
        case "blockquote":
          out.push(...inner.split("\n").map((l) => `> ${l}`), "");
          break;
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
        case "image":
          out.push(`![${(n.attrs && n.attrs.alt) || ""}](${(n.attrs && n.attrs.src) || ""})`, "");
          break;
        case "horizontalRule":
          out.push("---", "");
          break;
        default:
          if (n.content) blocks(n.content);  // 未知块级：递归子节点（避免 [n] 自我递归栈溢出）
          break;
      }
    }
  }
  if (doc && doc.content) blocks(doc.content);
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

/* ============ Markdown → Tiptap JSON ============ */

function inlineMdToNodes(text) {
  if (!text.trim()) return [];
  const nodes = [];
  const re = /(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(`([^`]+)`)|(~~([^~]+)~~)|(!?\[[^\]]*\]\([^)]+\))/g;
  let last = 0;
  let m;
  let plainBuf = "";

  const flush = () => {
    const t = plainBuf.replace(/\\([\\`*_{}\[\]()#!<>])/g, "$1");
    if (t) nodes.push({ type: "text", text: t });
    plainBuf = "";
  };

  while ((m = re.exec(text))) {
    plainBuf += text.slice(last, m.index);
    last = m.index + m[0].length;
    if (m[2] !== undefined) { flush(); nodes.push({ type: "text", marks: [{ type: "bold" }], text: m[2] }); }
    else if (m[4] !== undefined) { flush(); nodes.push({ type: "text", marks: [{ type: "italic" }], text: m[4] }); }
    else if (m[6] !== undefined) { flush(); nodes.push({ type: "text", marks: [{ type: "code" }], text: m[6] }); }
    else if (m[8] !== undefined) { flush(); nodes.push({ type: "text", marks: [{ type: "strike" }], text: m[8] }); }
    else if (m[9]) {
      const im = /^!?\[([^\]]*)\]\(([^)]+)\)$/.exec(m[9]);
      if (im) {
        flush();
        if (m[9].startsWith("!")) nodes.push({ type: "image", attrs: { src: im[2], alt: im[1] || "" } });
        else nodes.push({ type: "text", marks: [{ type: "link", attrs: { href: im[2] } }], text: im[1] });
      } else plainBuf += m[9];
    } else plainBuf += m[0];
  }
  plainBuf += text.slice(last);
  flush();
  if (!nodes.length) nodes.push({ type: "text", text: "" });
  return nodes;
}

function mdPara(text) { return { type: "paragraph", content: inlineMdToNodes(text) } }

export function markdownToTiptap(md) {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const content = [];
  let i = 0;
  let inCode = false;
  let codeLang = "";
  let codeBuf = [];
  let listBuf = null;

  const flushList = () => {
    if (!listBuf) return;
    content.push({
      type: listBuf.type,
      content: listBuf.items.map((t) => ({ type: "listItem", content: [mdPara(t)] })),
    });
    listBuf = null;
  };

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("```")) {
      flushList();
      if (inCode) {
        content.push({ type: "codeBlock", attrs: { language: codeLang }, content: [{ type: "text", text: codeBuf.join("\n") }] });
        inCode = false; codeBuf = [];
      } else { inCode = true; codeLang = line.slice(3).trim(); codeBuf = [] }
      i++; continue;
    }
    if (inCode) { codeBuf.push(line); i++; continue; }

    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h) { flushList(); content.push({ type: "heading", attrs: { level: h[1].length }, content: inlineMdToNodes(h[2]) }); i++; continue }

    if (/^---+\s*$/.test(line)) { flushList(); content.push({ type: "horizontalRule" }); i++; continue }

    const img = /^!\[([^\]]*)\]\(([^)]+)\)\s*$/.exec(line);
    if (img) { flushList(); content.push({ type: "image", attrs: { src: img[2], alt: img[1] } }); i++; continue }

    const ul = /^[-*]\s+(.*)$/.exec(line);
    if (ul) { if (!listBuf || listBuf.type !== "bulletList") { flushList(); listBuf = { type: "bulletList", items: [] } } listBuf.items.push(ul[1]); i++; continue }

    const ol = /^\d+[.)]\s+(.*)$/.exec(line);
    if (ol) { if (!listBuf || listBuf.type !== "orderedList") { flushList(); listBuf = { type: "orderedList", items: [] } } listBuf.items.push(ol[1]); i++; continue }

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
    if (prev && prev.type === "paragraph" && prev.content && prev.content.length) {
      prev.content[prev.content.length - 1].text += " " + line.trim();
    } else {
      content.push(mdPara(line.trim()));
    }
    i++;
  }
  flushList();
  if (inCode) content.push({ type: "codeBlock", attrs: { language: codeLang }, content: [{ type: "text", text: codeBuf.join("\n") }] });

  return { type: "doc", content: content.length ? content : [{ type: "paragraph", content: [{ type: "text", text: "" }] }] };
}
