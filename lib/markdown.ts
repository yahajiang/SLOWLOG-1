import { marked } from "marked";

const CALLOUT_TYPES: Record<string, { icon: string; label: string; bg: string; border: string; text: string }> = {
  NOTE: { icon: "ℹ️", label: "注意", bg: "bg-blue-50", border: "border-blue-400", text: "text-blue-800" },
  TIP: { icon: "💡", label: "提示", bg: "bg-green-50", border: "border-green-400", text: "text-green-800" },
  WARNING: { icon: "⚠️", label: "警告", bg: "bg-amber-50", border: "border-amber-400", text: "text-amber-800" },
  CAUTION: { icon: "🔥", label: "注意", bg: "bg-red-50", border: "border-red-400", text: "text-red-800" },
  IMPORTANT: { icon: "❗", label: "重要", bg: "bg-purple-50", border: "border-purple-400", text: "text-purple-800" },
};

function parseCallout(blockquoteHtml: string): string | null {
  const match = blockquoteHtml.match(/^<blockquote>\s*<p>\s*\[!(NOTE|TIP|WARNING|CAUTION|IMPORTANT)\]\s*<\/p>/i);
  if (!match) return null;
  const type = match[1].toUpperCase();
  const config = CALLOUT_TYPES[type];
  if (!config) return null;

  const content = blockquoteHtml
    .replace(/^<blockquote>\s*<p>\s*\[![A-Z]+\]\s*<\/p>/i, "")
    .replace(/<\/blockquote>$/, "")
    .trim();

  return `<div class="callout ${config.bg} ${config.border} ${config.text} border-l-4 rounded-r-lg p-4 my-6">
    <p class="font-semibold text-sm mb-1">${config.icon} ${config.label}</p>
    <div class="text-sm leading-relaxed opacity-90 [&>p]:mb-0">${content}</div>
  </div>`;
}

const calloutExtension = {
  name: "callout",
  level: "block" as const,
  start(src: string) {
    return src.match(/^>\s*\[!(NOTE|TIP|WARNING|CAUTION|IMPORTANT)\]/i)?.index;
  },
  tokenizer(src: string) {
    const match = src.match(/^>\s*\[!(NOTE|TIP|WARNING|CAUTION|IMPORTANT)\]\s*\n(?:>.*\n?)*/i);
    if (match) {
      return {
        type: "callout",
        raw: match[0],
        text: match[0],
      };
    }
  },
  renderer(token: { text: string }) {
    const lines = token.text.split("\n");
    const typeMatch = lines[0].match(/\[!([A-Z]+)\]/i);
    if (!typeMatch) return token.text;
    const type = typeMatch[1].toUpperCase();
    const config = CALLOUT_TYPES[type];
    if (!config) return token.text;

    const contentLines = lines.slice(1).map((l) => l.replace(/^>\s?/, "")).join("\n");
    const contentHtml = marked.parse(contentLines) as string;

    return `<div class="callout ${config.bg} ${config.border} ${config.text} border-l-4 rounded-r-lg p-4 my-6">
      <p class="font-semibold text-sm mb-1">${config.icon} ${config.label}</p>
      <div class="text-sm leading-relaxed opacity-90 [&>p]:mb-0">${contentHtml}</div>
    </div>`;
  },
};

marked.use({ extensions: [calloutExtension] });

export function markdownToHtml(md: string): string {
  marked.setOptions({ gfm: true, breaks: false });
  return marked.parse(md) as string;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s\u4e00-\u9fff-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function extractHeadings(md: string): { id: string; text: string }[] {
  const headingRegex = /^##\s+(.+)$/gm;
  const headings: { id: string; text: string }[] = [];
  let match: RegExpExecArray | null;
  while ((match = headingRegex.exec(md)) !== null) {
    const text = match[1].trim();
    headings.push({ id: slugify(text), text });
  }
  return headings;
}

export function injectHeadingIds(html: string): string {
  let counter = 0;
  return html.replace(/<h2>(.*?)<\/h2>/g, (_, text) => {
    const id = slugify(text.replace(/<[^>]*>/g, "")) || `heading-${counter++}`;
    return `<h2 id="${id}">${text}</h2>`;
  });
}
