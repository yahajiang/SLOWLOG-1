/** 服务端封面 SVG 渲染入口（契约文件拆分见 S2.7；实现在 cover-derive 与本模块共用） */
export { deriveCover, renderCoverSvg, fnv1a, STAMP_CODE } from "./cover-derive"
export type { CoverDerive, CoverPal } from "./cover-derive"
