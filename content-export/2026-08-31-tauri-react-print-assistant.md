---
title: "Tauri 2 + React 19 打造桌面打印助手：架构与实践"
titleEn: "Tauri 2 + React 19 打造桌面打印助手：架构与实践"
slug: "tauri-react-print-assistant"
date: "2026-08-31"
category: "Engineering"
tags: [Tauri, React, Rust, 桌面应用, 打印]
excerpt: "用 Tauri 2 + React 19 + Rust 构建多功能桌面打印助手，涵盖证件照制作、批量打印、标签设计等功能，分享跨语言架构经验。"
status: "published"
readTime: "10 min"
featured: true
---

## 项目背景

市面上的打印软件大多界面陈旧、功能分散。我希望做一个现代化的桌面打印助手，集成批量打印、证件照制作、文档处理、标签设计等功能于一体。

技术选型上，我选择了 Tauri 2 作为桌面框架——相比 Electron，它的安装包小 10 倍以上，内存占用也低得多。前端用 React 19 + Zustand 状态管理，后端用 Rust 调用 Windows 打印 API，文档处理则交给 Python 引擎。

## 技术栈一览

层级

技术

用途

桌面框架

Tauri 2

跨平台桌面壳，安全 IPC

前端

React 19 + Vite 7 + TypeScript

UI 渲染、状态管理

状态管理

Zustand

轻量级全局状态

后端

Rust + winprint + windows crate

打印控制、系统 API

文档处理

Python 引擎

图片处理、PDF 转换

打印机监控

async-snmp

SNMP 协议读取墨量/状态

## 产品变体系统

通过构建时的环境变量 VITE\_VARIANT，同一套代码可以构建出三个产品变体：

- full：全功能 9 板块（默认）
- std：标准版，去掉证件照制作（减小安装包，剔除 AI 模型）
- idphoto：证件照专用版，仅保留单一功能

```typescript
// variant.ts - 构建期产品变体
export type Variant = "full" | "std" | "idphoto";

export const VARIANT: Variant =
  (import.meta.env.VITE_VARIANT as Variant) || "full";

export function visiblePages(): PageKey[] {
  if (VARIANT === "std") return ORDER.filter((k) => k !== "idphoto");
  if (VARIANT === "idphoto") return ["idphoto"];
  return ORDER;
}
```

## 前端架构

### 懒加载与预加载

9 个页面模块中，5 个使用 React.lazy 懒加载。应用启动后，在浏览器空闲时通过 requestIdleCallback 预加载剩余模块：

```typescript
// 空闲时预加载所有可见页面
if (typeof requestIdleCallback === "function") {
  timer = window.requestIdleCallback(preload, { timeout: 2000 });
} else {
  timer = window.setTimeout(preload, 600);
}
```

### 导航指示器动画

侧边栏的选中指示器（pill）使用 useLayoutEffect 同步计算位置，避免闪烁。切换页面时，pill 通过 CSS transition 平滑移动到目标位置：

```typescript
useLayoutEffect(() => {
  const place = (animate: boolean) => {
    const pill = pillRef.current;
    const el = itemRefs.current[active];
    if (!pill || !el) return;
    if (!animate) pill.style.transition = "none";
    pill.style.transform = `translateY(${el.offsetTop}px)`;
    pill.style.height = `${el.offsetHeight}px`;
  };
  place(false); // 首次不动画
}, []);
```

## Rust 后端：Windows 打印集成

Rust 后端通过 Tauri 的 command 机制暴露 API 给前端调用。核心依赖：

- winprint：Windows 打印 API 封装
- windows crate：直接调用 Win32\_Graphics\_Printing、System\_Registry 等 API
- async-snmp：异步 SNMP 协议，读取打印机墨量、页数等状态

> Tauri 2 的安全模型要求所有 IPC 调用都必须在 capabilities 中显式声明。这比 Electron 的任意 Node.js 调用安全得多，但也需要更仔细地设计 API 边界。

## Python 引擎：文档与图片处理

文档处理（PDF 转换、图片压缩、证件照裁剪等）由独立的 Python 进程负责。Rust 后端通过 HTTP 与 Python 引擎通信（本地 127.0.0.1:8765）：

- Python 引擎独立打包为 exe（PyInstaller），随应用安装
- 启动时自动检测引擎版本，版本不匹配时提示用户重启引擎
- 引擎崩溃不影响主应用，设置页提供「一键重启引擎」按钮

## 主题系统

支持浅色/深色/跟随系统三种模式，通过 Zustand store + CSS 变量实现：

```typescript
// themeStore.ts
export const useThemeStore = create<ThemeState>((set) => ({
  theme: "system",
  setTheme: (theme) => {
    set({ theme });
    localStorage.setItem("theme", theme);
    applyTheme(theme);
  },
}));
```

## 安装包与分发

使用 NSIS 打包 Windows 安装程序，支持：

- 中英文语言选择
- 自定义安装侧边栏/头部图片
- perMachine 安装模式
- 安装前后钩子脚本（nsis\_hooks.nsi）

## 踩坑与经验

1. Tauri 2 的 CSP 限制：默认禁止内联脚本，需要在 tauri.conf.json 中显式配置 connect-src 白名单
2. Windows 打印 API 的字符编码：打印机名称包含中文时，Rust 的 CString 需要正确处理 UTF-16 编码
3. Python 引擎的生命周期管理：需要在 Rust 端实现进程监控和自动重启机制
4. NSIS 安装包的中文支持：需要在 Cargo.toml 中配置 SimpChinese 语言包

## 总结

Tauri 2 + React 19 + Rust 的组合非常适合构建高性能桌面应用。相比 Electron，安装包从 150MB 降到 15MB，内存占用从 300MB 降到 50MB。Python 引擎的引入让文档处理能力大幅提升，同时保持了主应用的轻量。

如果你也在考虑做桌面应用，强烈推荐试试 Tauri 2。它的安全模型、跨平台能力和性能表现都非常出色。

