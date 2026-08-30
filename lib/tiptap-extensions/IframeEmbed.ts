import { Node, mergeAttributes } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    iframeEmbed: {
      setIframe: (attrs: { src: string; width?: string; height?: string }) => ReturnType;
    };
  }
}

function getEmbedUrl(url: string): string | null {
  const u = url.trim();

  // YouTube
  const ytMatch = u.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;

  // Vimeo
  const vimeoMatch = u.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;

  // Bilibili
  const biliMatch = u.match(/bilibili\.com\/video\/(BV[a-zA-Z0-9]+)/);
  if (biliMatch) return `https://player.bilibili.com/player.html?bvid=${biliMatch[1]}&high_quality=1`;

  // Direct iframe src
  if (u.startsWith("https://") || u.startsWith("http://")) return u;

  return null;
}

export const IframeEmbed = Node.create({
  name: "iframeEmbed",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      src: { default: null },
      width: { default: "100%" },
      height: { default: "400px" },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="iframe-embed"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "iframe-embed" })];
  },

  addCommands() {
    return {
      setIframe:
        (attrs) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs,
          });
        },
    };
  },

  addPasteRules() {
    return [];
  },
});

export { getEmbedUrl };
