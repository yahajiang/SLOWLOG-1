import { marked } from "marked";
import TurndownService from "turndown";

// Configure marked
marked.setOptions({ gfm: true, breaks: false });

// Configure turndown
const turndownService = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
});

// Custom rules for better Markdown output
turndownService.addRule("taskList", {
  filter: (node) => {
    return (
      node.nodeName === "LI" &&
      node.getAttribute("data-checked") !== null
    );
  },
  replacement: (_content, node) => {
    const checked = node.getAttribute("data-checked") === "true";
    return `${checked ? "- [x]" : "- [ ]"} ${node.textContent}\n`;
  },
});

turndownService.addRule("mathBlock", {
  filter: (node) => {
    return (
      node.nodeName === "DIV" &&
      node.classList.contains("math-block")
    );
  },
  replacement: (_content, node) => {
    return `\n$$\n${node.textContent}\n$$\n`;
  },
});

turndownService.addRule("mathInline", {
  filter: (node) => {
    return (
      node.nodeName === "SPAN" &&
      node.classList.contains("math-inline")
    );
  },
  replacement: (_content, node) => {
    return `$${node.textContent}$`;
  },
});

// Markdown -> HTML -> Tiptap JSON
export function markdownToTiptapJson(markdown: string): Record<string, unknown> {
  const html = marked.parse(markdown) as string;
  return { type: "doc", content: htmlToTiptapNodes(html) };
}

function htmlToTiptapNodes(html: string): Record<string, unknown>[] {
  const div = document.createElement("div");
  div.innerHTML = html;
  const nodes: Record<string, unknown>[] = [];

  for (const child of Array.from(div.childNodes)) {
    const node = convertNode(child);
    if (node) nodes.push(node);
  }

  if (nodes.length === 0) {
    nodes.push({ type: "paragraph", content: [] });
  }

  return nodes;
}

function convertNode(node: Node): Record<string, unknown> | null {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent || "";
    if (!text.trim()) return null;
    return { type: "text", text };
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return null;

  const el = node as HTMLElement;
  const tag = el.tagName.toLowerCase();

  switch (tag) {
    case "h1":
    case "h2":
    case "h3":
    case "h4":
    case "h5":
    case "h6":
      return {
        type: "heading",
        attrs: { level: parseInt(tag[1]), textAlign: null },
        content: convertInline(el),
      };

    case "p":
      return {
        type: "paragraph",
        attrs: { textAlign: null },
        content: convertInline(el),
      };

    case "blockquote":
      return {
        type: "blockquote",
        content: Array.from(el.childNodes)
          .map((c) => convertNode(c))
          .filter(Boolean) as Record<string, unknown>[],
      };

    case "pre": {
      const code = el.querySelector("code");
      const lang = code?.className.replace("language-", "") || "";
      return {
        type: "codeBlock",
        attrs: { language: lang },
        content: [{ type: "text", text: code?.textContent || el.textContent || "" }],
      };
    }

    case "code":
      // Inline code
      return {
        type: "text",
        text: el.textContent || "",
        marks: [{ type: "code" }],
      };

    case "ul":
      return {
        type: "bulletList",
        content: Array.from(el.children)
          .map((li) => convertListItem(li, "listItem"))
          .filter(Boolean) as Record<string, unknown>[],
      };

    case "ol":
      return {
        type: "orderedList",
        content: Array.from(el.children)
          .map((li) => convertListItem(li, "listItem"))
          .filter(Boolean) as Record<string, unknown>[],
      };

    case "table":
      return convertTable(el);

    case "hr":
      return { type: "horizontalRule" };

    case "figure":
    case "img": {
      const img = tag === "img" ? el : el.querySelector("img");
      if (img) {
        return {
          type: "image",
          attrs: {
            src: img.getAttribute("src") || "",
            alt: img.getAttribute("alt") || "",
            title: img.getAttribute("title") || null,
          },
        };
      }
      return null;
    }

    case "a": {
      const href = el.getAttribute("href") || "";
      return {
        type: "text",
        text: el.textContent || href,
        marks: [{ type: "link", attrs: { href, target: "_blank", rel: "noopener noreferrer" } }],
      };
    }

    case "strong":
    case "b":
      return wrapInline(el, "bold");

    case "em":
    case "i":
      return wrapInline(el, "italic");

    case "u":
      return wrapInline(el, "underline");

    case "del":
    case "s":
      return wrapInline(el, "strike");

    case "mark":
      return wrapInline(el, "highlight");

    case "div": {
      // Check for task list
      const taskItems = el.querySelectorAll('li[data-checked]');
      if (taskItems.length > 0) {
        return {
          type: "taskList",
          content: Array.from(taskItems)
            .map((li) => convertTaskItem(li))
            .filter(Boolean) as Record<string, unknown>[],
        };
      }
      // Fall through to generic block
      const children = Array.from(el.childNodes)
        .map((c) => convertNode(c))
        .filter(Boolean) as Record<string, unknown>[];
      return children.length === 1 ? children[0] : { type: "paragraph", content: convertInline(el) };
    }

    default: {
      // Try to extract inline content
      const content = convertInline(el);
      if (content.length > 0) {
        return { type: "paragraph", content };
      }
      return null;
    }
  }
}

function convertInline(el: Element): Record<string, unknown>[] {
  const nodes: Record<string, unknown>[] = [];

  for (const child of Array.from(el.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) {
      const text = child.textContent || "";
      if (text) nodes.push({ type: "text", text });
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const childEl = child as HTMLElement;
      const tag = childEl.tagName.toLowerCase();

      if (tag === "strong" || tag === "b") {
        nodes.push(wrapInline(childEl, "bold"));
      } else if (tag === "em" || tag === "i") {
        nodes.push(wrapInline(childEl, "italic"));
      } else if (tag === "u") {
        nodes.push(wrapInline(childEl, "underline"));
      } else if (tag === "code") {
        nodes.push({
          type: "text",
          text: childEl.textContent || "",
          marks: [{ type: "code" }],
        });
      } else if (tag === "a") {
        nodes.push({
          type: "text",
          text: childEl.textContent || "",
          marks: [{ type: "link", attrs: { href: childEl.getAttribute("href") || "" } }],
        });
      } else if (tag === "br") {
        nodes.push({ type: "hardBreak" });
      } else {
        // Recurse
        const inner = convertInline(childEl);
        nodes.push(...inner);
      }
    }
  }

  return nodes;
}

function wrapInline(el: Element, markType: string): Record<string, unknown> {
  return {
    type: "text",
    text: el.textContent || "",
    marks: [{ type: markType }],
  };
}

function convertListItem(li: Element, _type: string): Record<string, unknown> | null {
  const content: Record<string, unknown>[] = [];

  for (const child of Array.from(li.childNodes)) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      const tag = (child as HTMLElement).tagName.toLowerCase();
      if (tag === "ul") {
        content.push({
          type: "bulletList",
          content: Array.from((child as HTMLElement).children)
            .map((c) => convertListItem(c, "listItem"))
            .filter(Boolean) as Record<string, unknown>[],
        });
      } else if (tag === "ol") {
        content.push({
          type: "orderedList",
          content: Array.from((child as HTMLElement).children)
            .map((c) => convertListItem(c, "listItem"))
            .filter(Boolean) as Record<string, unknown>[],
        });
      } else {
        const node = convertNode(child);
        if (node) content.push(node);
      }
    } else if (child.nodeType === Node.TEXT_NODE && child.textContent?.trim()) {
      content.push({
        type: "paragraph",
        content: [{ type: "text", text: child.textContent }],
      });
    }
  }

  if (content.length === 0) {
    content.push({ type: "paragraph", content: [] });
  }

  return {
    type: "listItem",
    content,
  };
}

function convertTaskItem(li: Element): Record<string, unknown> | null {
  const checked = li.getAttribute("data-checked") === "true";
  const text = li.textContent || "";
  return {
    type: "taskItem",
    attrs: { checked },
    content: [
      {
        type: "paragraph",
        content: [{ type: "text", text }],
      },
    ],
  };
}

function convertTable(table: Element): Record<string, unknown> {
  const rows = Array.from(table.querySelectorAll("tr"));
  if (rows.length === 0) return { type: "paragraph", content: [] };

  const firstRow = rows[0];
  const isHeader = firstRow.querySelector("th") !== null;
  const colCount = Array.from(firstRow.children).length;

  const tableRows: Record<string, unknown>[] = [];

  for (const row of rows) {
    const cells = Array.from(row.children).map((cell) => ({
      type: cell.tagName.toLowerCase() === "th" ? "tableHeader" : "tableCell",
      attrs: {
        colspan: parseInt(cell.getAttribute("colspan") || "1"),
        rowspan: parseInt(cell.getAttribute("rowspan") || "1"),
      },
      content: [
        {
          type: "paragraph",
          content: convertInline(cell),
        },
      ],
    }));

    tableRows.push({
      type: "tableRow",
      content: cells,
    });
  }

  return {
    type: "table",
    attrs: {
      columns: Array(colCount).fill(null).map(() => ({})),
    },
    content: tableRows,
  };
}

// Tiptap JSON -> HTML -> Markdown
export function tiptapJsonToMarkdown(json: Record<string, unknown>): string {
  const html = tiptapJsonToHtml(json);
  return turndownService.turndown(html);
}

function tiptapJsonToHtml(json: Record<string, unknown>): string {
  const content = json.content as Record<string, unknown>[] | undefined;
  if (!content) return "";
  return content.map((node) => nodeToHtml(node)).join("\n");
}

function nodeToHtml(node: Record<string, unknown>): string {
  const type = node.type as string;
  const content = node.content as Record<string, unknown>[] | undefined;
  const attrs = (node.attrs || {}) as Record<string, unknown>;
  const marks = (node.marks || []) as Record<string, unknown>[];

  const innerHtml = content ? content.map((c) => nodeToHtml(c)).join("") : "";

  let html = "";

  switch (type) {
    case "heading":
      html = `<h${attrs.level}>${innerHtml}</h${attrs.level}>`;
      break;
    case "paragraph":
      html = `<p>${innerHtml}</p>`;
      break;
    case "blockquote":
      html = `<blockquote>${innerHtml}</blockquote>`;
      break;
    case "codeBlock":
      html = `<pre><code class="language-${attrs.language || ""}">${escapeHtml(innerHtml)}</code></pre>`;
      break;
    case "bulletList":
      html = `<ul>${innerHtml}</ul>`;
      break;
    case "orderedList":
      html = `<ol>${innerHtml}</ol>`;
      break;
    case "listItem":
      html = `<li>${innerHtml}</li>`;
      break;
    case "taskList":
      html = `<div class="task-list">${innerHtml}</div>`;
      break;
    case "taskItem": {
      const checked = attrs.checked ? "true" : "false";
      html = `<li data-checked="${checked}">${innerHtml}</li>`;
      break;
    }
    case "table":
      html = `<table>${innerHtml}</table>`;
      break;
    case "tableRow":
      html = `<tr>${innerHtml}</tr>`;
      break;
    case "tableCell":
      html = `<td>${innerHtml}</td>`;
      break;
    case "tableHeader":
      html = `<th>${innerHtml}</th>`;
      break;
    case "horizontalRule":
      html = "<hr>";
      break;
    case "image":
      html = `<img src="${attrs.src}" alt="${attrs.alt || ""}" title="${attrs.title || ""}">`;
      break;
    case "hardBreak":
      html = "<br>";
      break;
    case "text": {
      const text = (node.text as string) || "";
      return applyMarks(text, marks);
    }
    default:
      html = innerHtml;
  }

  return html;
}

function applyMarks(text: string, marks: Record<string, unknown>[]): string {
  let result = escapeHtml(text);

  for (const mark of marks) {
    const markType = mark.type as string;
    const markAttrs = (mark.attrs || {}) as Record<string, unknown>;

    switch (markType) {
      case "bold":
        result = `<strong>${result}</strong>`;
        break;
      case "italic":
        result = `<em>${result}</em>`;
        break;
      case "underline":
        result = `<u>${result}</u>`;
        break;
      case "strike":
        result = `<del>${result}</del>`;
        break;
      case "code":
        result = `<code>${result}</code>`;
        break;
      case "highlight": {
        const hlColor = markAttrs.color as string | undefined;
        if (hlColor) {
          result = `<mark style="background-color: ${hlColor}">${result}</mark>`;
        } else {
          result = `<mark>${result}</mark>`;
        }
        break;
      }
      case "link":
        result = `<a href="${markAttrs.href || ""}">${result}</a>`;
        break;
      case "textStyle": {
        const color = markAttrs.color as string | undefined;
        if (color) {
          result = `<span style="color: ${color}">${result}</span>`;
        }
        break;
      }
    }
  }

  return result;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
