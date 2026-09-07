// 文章版本历史（v0.3 P2）：单人博客，版本存 localStorage（零迁移、零后端）。
// 策略：距上一版快照 ≥5 分钟才落一版（避免 3s 自动保存冲爆列表），上限 10 版 FIFO。
const KEY = (id: string) => `sl-versions:${id}`;
const MIN_INTERVAL = 5 * 60 * 1000;
const MAX_VERSIONS = 10;

export type PostVersion = { at: number; words: number; content: unknown };

export function getVersions(id: string): PostVersion[] {
  try {
    const raw = localStorage.getItem(KEY(id));
    const list = raw ? (JSON.parse(raw) as PostVersion[]) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function countWords(content: unknown): number {
  try {
    let n = 0;
    const walk = (node: any) => {
      if (!node) return;
      if (Array.isArray(node)) return node.forEach(walk);
      if (typeof node.text === "string") n += node.text.replace(/\s/g, "").length;
      if (node.content) walk(node.content);
    };
    walk(content);
    return n;
  } catch {
    return 0;
  }
}

/** 快照当前内容。距上一版 ≥5 分钟才落一版；返回是否真的落了。 */
export function snapVersion(id: string, content: unknown): boolean {
  if (!id) return false;
  try {
    const list = getVersions(id);
    const last = list[0];
    if (last && Date.now() - last.at < MIN_INTERVAL) return false;
    list.unshift({ at: Date.now(), words: countWords(content), content });
    try {
      localStorage.setItem(KEY(id), JSON.stringify(list.slice(0, MAX_VERSIONS)));
    } catch {
      // 配额溢出：留最近 3 版再试
      try { localStorage.setItem(KEY(id), JSON.stringify(list.slice(0, 3))) } catch {}
    }
    return true;
  } catch {
    return false;
  }
}

/** 强制落一版（回滚等关键动作前保住当前状态）。 */
export function forceSnap(id: string, content: unknown): boolean {
  try {
    const list = getVersions(id);
    list.unshift({ at: Date.now(), words: countWords(content), content });
    try {
      localStorage.setItem(KEY(id), JSON.stringify(list.slice(0, MAX_VERSIONS)));
    } catch {
      try { localStorage.setItem(KEY(id), JSON.stringify(list.slice(0, 3))) } catch {}
    }
    return true;
  } catch {
    return false;
  }
}
