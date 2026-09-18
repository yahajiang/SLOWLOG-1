import { ART_PALETTES, CAT_ABBR } from "./categories"
import { resolveTagSymbol } from "./categories"
import type { TagSymbol } from "./categories"

/** 与 CoverArt.tsx hashVariant 一致 */
export function fnv1a(seed: string, max: number): number {
  let h = 0x811c9dc5
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return Math.abs(h) % max
}

export const STAMP_CODE: Record<string, string> = {
  grid: "GRD",
  shield: "SHL",
  doubleCircle: "MIR",
  wave: "WAV",
  diamond: "DMN",
  window: "WIN",
  hex: "HEX",
  circle: "CIR",
}

export type CoverPal = { paper: string; ink: string; wash: string; accent: string }

export type CoverDerive = {
  cat: string
  pal: CoverPal
  layout: number
  variant: number
  variant4: number
  symbol: TagSymbol | null
  stampCode: string
  abbr: string
  noNum: string
  initial: string
  tag: string | null
  meta: string
}

const KNOWN = ["Design", "Build", "Lab", "Found", "Log"] as const
const FALLBACK_PAL: CoverPal = { paper: "#F5F3EF", ink: "#3A332E", wash: "#E8E0D8", accent: "#C9A98A" }

export function deriveCover(input: {
  id: string
  title: string
  category?: string | { name?: string } | null
  tags?: string[]
}): CoverDerive {
  const getCategoryName = (c: any): string => {
    if (typeof c === "string") return c
    if (c && typeof c === "object") return c.name || c.nameZh || ""
    return ""
  }
  const rawCat = getCategoryName(input.category)
  const cat = (KNOWN as readonly string[]).includes(rawCat)
    ? rawCat
    : rawCat
      ? KNOWN[fnv1a(rawCat, KNOWN.length)]
      : "Design"
  const pal = ((ART_PALETTES as any)[cat] as CoverPal) || FALLBACK_PAL
  const tags = input.tags || []
  // CoverArt.tsx: post.title；category name 已由调用方从 category.name 解析
  const title = input.title || ""
  const id = input.id || ""
  const seed = title + cat + id + tags.join(",")
  const layout = fnv1a(title + id + "L", 8)
  const variant = fnv1a(seed, 8)
  const variant4 = fnv1a(seed + "4", 4)
  const symbol = resolveTagSymbol(tags)
  const stampCode = symbol ? STAMP_CODE[symbol] : "GEN"
  const abbr = (CAT_ABBR as any)[cat] || cat.slice(0, 3).toUpperCase()
  const noNum = String(fnv1a(id || title || "0", 9000) + 1000).padStart(4, "0")
  const initial = (title || "A").charAt(0)
  const tag = tags[0]?.trim() ? tags[0].trim().replace(/[[\]]/g, "").toUpperCase() : null
  const meta = `${abbr} · ${noNum}${tag ? ` · ${tag}` : ""}`
  return { cat, pal, layout, variant, variant4, symbol, stampCode, abbr, noNum, initial, tag, meta }
}

function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function stampSvg(symbol: TagSymbol | null, pal: CoverPal, variant4: number, x: number, y: number) {
  const { ink, accent } = pal
  const code = symbol ? STAMP_CODE[symbol] : "GEN"
  let mark = ""
  if (symbol === "grid") {
    const solid = variant4 % 4
    mark = `<g opacity="0.5">` +
      [0, 1, 2, 3]
        .map(
          (i) =>
            `<rect x="${x + (i % 2) * 20}" y="${y + Math.floor(i / 2) * 20}" width="16" height="16" fill="${i === solid ? accent : "none"}" stroke="${i === solid ? accent : ink}" stroke-width="1"/>`
        )
        .join("") +
      `</g>`
  } else if (symbol === "shield") {
    mark = `<path d="M${x + 22} ${y + 2} L${x + 40} ${y + 10} V${y + 26} Q${x + 40} ${y + 42} ${x + 22} ${y + 50} Q${x + 4} ${y + 42} ${x + 4} ${y + 26} V${y + 10} Z" fill="none" stroke="${ink}" stroke-width="1.5" opacity="0.4"/><line x1="${x + 22}" y1="${y + 14}" x2="${x + 22}" y2="${y + 34}" stroke="${accent}" stroke-width="1.6" opacity="0.5"/>`
  } else if (symbol === "doubleCircle") {
    mark = `<circle cx="${x + 20}" cy="${y + 20}" r="16" fill="none" stroke="${ink}" stroke-width="2" opacity="0.4"/><circle cx="${x + 32}" cy="${y + 32}" r="16" fill="none" stroke="${accent}" stroke-width="2" opacity="0.5"/>`
  } else if (symbol === "wave") {
    mark = `<path d="M${x} ${y + 10} Q${x + 14} ${y + 2} ${x + 26} ${y + 10} T${x + 50} ${y + 10}" fill="none" stroke="${ink}" stroke-width="1.4" opacity="0.35"/><path d="M${x} ${y + 20} Q${x + 14} ${y + 12} ${x + 26} ${y + 20} T${x + 50} ${y + 20}" fill="none" stroke="${accent}" stroke-width="1.5" opacity="0.5"/>`
  } else if (symbol === "diamond") {
    mark = `<polygon points="${x + 22},${y + 2} ${x + 42},${y + 22} ${x + 22},${y + 42} ${x + 2},${y + 22}" fill="none" stroke="${accent}" stroke-width="1.5" opacity="0.5"/><polygon points="${x + 22},${y + 12} ${x + 32},${y + 22} ${x + 22},${y + 32} ${x + 12},${y + 22}" fill="none" stroke="${ink}" stroke-width="1.2" opacity="0.35"/>`
  } else if (symbol === "window") {
    mark = `<rect x="${x}" y="${y}" width="64" height="48" fill="none" stroke="${accent}" stroke-width="2" opacity="0.5"/><line x1="${x}" y1="${y + 12}" x2="${x + 64}" y2="${y + 12}" stroke="${ink}" stroke-width="1" opacity="0.3"/>`
  } else if (symbol === "hex") {
    mark = `<polygon points="${x + 23},${y + 2} ${x + 41},${y + 13} ${x + 41},${y + 33} ${x + 23},${y + 44} ${x + 5},${y + 33} ${x + 5},${y + 13}" fill="none" stroke="${accent}" stroke-width="1.5" opacity="0.5"/><circle cx="${x + 23}" cy="${y + 23}" r="2" fill="${ink}" opacity="0.35"/>`
  } else {
    mark = `<circle cx="${x + 22}" cy="${y + 22}" r="18" fill="none" stroke="${accent}" stroke-width="1.5" opacity="0.5"/><circle cx="${x + 22}" cy="${y + 22}" r="10" fill="none" stroke="${ink}" stroke-width="1.2" opacity="0.35"/><circle cx="${x + 22}" cy="${y + 22}" r="3" fill="${ink}" opacity="0.4"/>`
  }
  return (
    mark +
    `<text x="${x + 22}" y="${y + 58}" font-family="ui-monospace,monospace" font-size="10" fill="${ink}" opacity="0.45" text-anchor="middle">${esc(code)}</text>`
  )
}

export function renderCoverSvg(d: CoverDerive, width = 800, height = 450): string {
  const { pal, layout, variant, variant4, initial, noNum, abbr, meta, symbol } = d
  const { paper, ink, wash, accent } = pal
  const sx = (p: number) => (p / 100) * width
  const sy = (p: number) => (p / 100) * height
  let art = ""

  if (layout === 0) {
    art = `
      <rect x="${sx(8)}" y="${sy(18)}" width="${sx(28)}" height="${sy(24)}" fill="${wash}" opacity="0.35"/>
      <rect x="${sx(40)}" y="${sy(22)}" width="${sx(18)}" height="${sy(18)}" fill="none" stroke="${ink}" stroke-width="1" opacity="0.25"/>
      <g opacity="0.4">${[0, 1, 2, 3]
        .map(
          (i) =>
            `<rect x="${sx(62 + (i % 2) * 8)}" y="${sy(20 + Math.floor(i / 2) * 8)}" width="${sx(6)}" height="${sy(10)}" fill="${i === variant % 4 ? accent : "none"}" stroke="${ink}" stroke-width="0.8"/>`
        )
        .join("")}</g>
      <text x="${sx(10)}" y="${sy(16)}" font-family="ui-monospace,monospace" font-size="${height * 0.03}" fill="${ink}" opacity="0.32" letter-spacing="2">${esc(abbr)}</text>`
  } else if (layout === 1) {
    art = [0, 1, 2]
      .map(
        (i) =>
          `<rect x="${sx(10)}" y="${sy(28 + i * 14)}" width="${sx(40 - i * 8)}" height="${sy(5)}" fill="${i === variant4 % 3 ? accent : wash}" opacity="0.25"/>`
      )
      .join("")
  } else if (layout === 2) {
    art = `
      <path d="M0 ${height} L${sx(70)} ${height} L0 ${sy(52)} Z" fill="${wash}" opacity="0.22"/>
      <circle cx="${sx(70)}" cy="${sy(30)}" r="${height * 0.18}" fill="none" stroke="${ink}" stroke-width="1.3" opacity="0.28" stroke-dasharray="4 3"/>
      <circle cx="${sx(70)}" cy="${sy(30)}" r="${height * 0.1}" fill="none" stroke="${wash}" stroke-width="1.2" opacity="0.45"/>
      <circle cx="${sx(70)}" cy="${sy(30)}" r="6" fill="${accent}" opacity="0.9"/>
      <text x="${sx(14)}" y="${sy(35)}" font-family="Georgia,serif" font-size="${height * 0.12}" font-style="italic" fill="${ink}" opacity="0.2">${esc(initial)}</text>`
  } else if (layout === 3) {
    art = `
      <line x1="0" y1="${sy(30)}" x2="${width}" y2="${sy(30)}" stroke="${wash}" stroke-width="1" opacity="0.35"/>
      <rect x="${sx(8)}" y="${sy(38)}" width="${sx(36)}" height="${sy(28)}" fill="none" stroke="${ink}" stroke-width="1" opacity="0.3"/>
      <text x="${sx(8)}" y="${sy(14)}" font-family="ui-monospace,monospace" font-size="${height * 0.028}" fill="${ink}" opacity="0.35">${esc(noNum)}</text>`
  } else if (layout === 4) {
    art = `
      <rect x="${sx(4)}" y="${sy(8)}" width="${sx(92)}" height="${sy(84)}" fill="none" stroke="${ink}" stroke-width="1" opacity="0.12"/>
      <rect x="${sx(8)}" y="${sy(14)}" width="${sx(84)}" height="${sy(72)}" fill="none" stroke="${wash}" stroke-width="2" opacity="0.5"/>
      <rect x="${sx(18)}" y="${sy(30)}" width="${sx(28)}" height="${sy(28)}" fill="none" stroke="${accent}" stroke-width="1" opacity="0.35"/>`
  } else if (layout === 5) {
    art = `
      <polyline points="${sx(8)},${sy(60)} ${sx(30)},${sy(40)} ${sx(50)},${sy(48)} ${sx(70)},${sy(30)} ${sx(90)},${sy(42)}" fill="none" stroke="${ink}" stroke-width="1.2" opacity="0.22"/>
      <polyline points="${sx(8)},${sy(70)} ${sx(40)},${sy(55)} ${sx(70)},${sy(62)} ${sx(90)},${sy(48)}" fill="none" stroke="${accent}" stroke-width="1.1" opacity="0.5"/>
      <circle cx="${sx(70)}" cy="${sy(30)}" r="5" fill="${accent}" opacity="0.9"/>
      <text x="${sx(12)}" y="${sy(18)}" font-family="ui-monospace,monospace" font-size="${height * 0.028}" fill="${ink}" opacity="0.3" letter-spacing="2">PATH ${esc(noNum)}</text>`
  } else if (layout === 6) {
    art = `
      <line x1="${sx(12)}" y1="0" x2="${sx(12)}" y2="${height}" stroke="${wash}" stroke-width="1" opacity="0.4"/>
      <rect x="${sx(20)}" y="${sy(22)}" width="${sx(40)}" height="${sy(40)}" fill="none" stroke="${wash}" stroke-width="1.5" opacity="0.5"/>
      <text x="${sx(28)}" y="${sy(48)}" font-family="Georgia,serif" font-size="${height * 0.12}" fill="${ink}" opacity="0.2">${esc(noNum.slice(-2))}</text>`
  } else {
    const dots: string[] = []
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 10; c++) {
        dots.push(
          `<circle cx="${sx(14 + c * 7)}" cy="${sy(20 + r * 9)}" r="1.2" fill="${ink}" opacity="0.12"/>`
        )
      }
    }
    art = dots.join("") +
      `<rect x="${sx(20)}" y="${sy(28)}" width="${sx(22)}" height="${sy(30)}" fill="none" stroke="${wash}" stroke-width="1.5" opacity="0.5" transform="rotate(-6 ${sx(30)} ${sy(40)})"/>`
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="${paper}"/>
  <g opacity="0.04">${Array.from({ length: Math.floor(height / 8) }, (_, i) => `<line x1="0" y1="${i * 8}" x2="${width}" y2="${i * 8}" stroke="${wash}" stroke-width="1"/>`).join("")}</g>
  <line x1="${sx(4)}" y1="${sy(4)}" x2="${sx(96)}" y2="${sy(4)}" stroke="${ink}" stroke-width="1" opacity="0.08"/>
  ${art}
  ${stampSvg(symbol, pal, variant4, width - 120, height * 0.28)}
  <line x1="${sx(4)}" y1="${height - sy(8)}" x2="${sx(96)}" y2="${height - sy(8)}" stroke="${ink}" stroke-width="1" opacity="0.12"/>
  <text x="${sx(4)}" y="${height - 10}" font-family="ui-monospace,monospace" font-size="${Math.max(10, height * 0.028)}" fill="${ink}" opacity="0.4" letter-spacing="1.2">${esc(meta)}</text>
</svg>`
}
