// 过场骨架（纸纹 + 装订线 + 骨架卡）：只包 (shell) 组内的列表页。
// ⚠️ 不得扩大作用域到 /t/posts 等会 notFound 的段 —— loading 边界会先冲刷
// 200 状态头，把真 404 吞成 soft-404（详见 components/LoadingShell.tsx 头注）。
export { default } from "@/components/LoadingShell";
