import { marked } from "marked";

export function markdownToHtml(md: string): string {
  // Configure marked for our needs
  marked.setOptions({
    gfm: true,
    breaks: false,
  });
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
  // Add id to h2 tags based on their text
  let counter = 0;
  return html.replace(/<h2>(.*?)<\/h2>/g, (_, text) => {
    const id = slugify(text.replace(/<[^>]*>/g, "")) || `heading-${counter++}`;
    return `<h2 id="${id}">${text}</h2>`;
  });
}
