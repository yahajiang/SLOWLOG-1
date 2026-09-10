/** 品牌格言池：欢迎幕 / 加载页 / 页脚共用。每次访问随机抽一条。 */

export type Lang = "zh" | "en";

export const ZH_TAGLINES = [
  "慢下来，写点值得读的东西。",
  "纸上有字，心里有空。",
  "不赶路，只赶得上自己。",
  "把注意力还给阅读。",
  "一页慢慢读，胜过十篇匆匆过。",
  "好的句子，值得停下来。",
  "安静写，认真读。",
  "时间给值得的人和文。",
] as const;

export const EN_TAGLINES = [
  "Slow down, write something worth reading.",
  "Ink on paper. Room in the mind.",
  "No rush — only what stays with you.",
  "Give your attention back to reading.",
  "One page slowly beats ten skimmed.",
  "Good sentences deserve a pause.",
  "Write quietly. Read with care.",
  "Time for people and prose that matter.",
] as const;

export function pickTagline(lang: Lang | string): string {
  const pool = lang === "en" ? EN_TAGLINES : ZH_TAGLINES;
  const i = Math.floor(Math.random() * pool.length);
  return pool[i] as string;
}
