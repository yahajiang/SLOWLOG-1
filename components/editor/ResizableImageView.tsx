"use client"
import { NodeViewWrapper } from "@tiptap/react"
import React, { useRef, useState, useCallback, useEffect } from "react"

export function ResizableImageView({ node, updateAttributes, selected }: any) {
  const { src, alt, title, width } = node.attrs
  const [resizing, setResizing] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  const startRef = useRef({ x: 0, w: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  const handleResize = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const img = imgRef.current
    const container = containerRef.current
    if (!img || !container) return

    // 获取编辑器内容区的实际宽度作为最大宽度
    const editorEl = container.closest(".ProseMirror") || container.closest(".flex-1")
    const maxW = editorEl ? editorEl.clientWidth - 32 : 600 // 减去 padding

    startRef.current = { x: e.clientX, w: img.getBoundingClientRect().width }
    setResizing(true)

    const onMove = (ev: PointerEvent) => {
      ev.preventDefault()
      const delta = ev.clientX - startRef.current.x
      const newW = Math.max(80, Math.min(maxW, startRef.current.w + delta))
      // 用像素直接计算百分比，更跟手
      const percent = (newW / maxW) * 100
      updateAttributes({ width: `${Math.round(percent)}%` })
    }
    const onUp = () => {
      setResizing(false)
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
    }
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
  }, [updateAttributes])

  // 阻止图片点击时的默认拖拽行为
  useEffect(() => {
    const img = imgRef.current
    if (!img) return
    const prevent = (e: Event) => e.preventDefault()
    img.addEventListener("dragstart", prevent)
    return () => img.removeEventListener("dragstart", prevent)
  }, [])

  return (
    <NodeViewWrapper className="my-6" data-drag-handle="false">
      <div
        ref={containerRef}
        className={`group relative rounded-xl border-2 transition-all ${selected ? "border-blue-400" : "border-transparent hover:border-zinc-200"}`}
        style={{ width: width || "100%", maxWidth: "100%", userSelect: "none" }}
      >
        {/* 图片顶部工具条 */}
        <div className={`absolute top-0 left-0 right-0 z-20 flex items-center justify-center gap-1 p-1.5 transition-opacity rounded-t-xl ${selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`} style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)" }}>
          {["25%", "50%", "75%", "100%"].map((w) => (
            <button
              key={w}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); updateAttributes({ width: w }) }}
              className={`px-2.5 py-0.5 text-[11px] rounded-full border transition-colors font-medium ${width === w ? "bg-white text-zinc-900 border-white" : "bg-white/80 border-white/50 text-zinc-700 hover:bg-white"}`}
            >
              {w}
            </button>
          ))}
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); updateAttributes({ width: null }) }}
            className="px-2 py-0.5 text-[11px] rounded-full border bg-white/80 border-white/50 text-zinc-700 hover:bg-white"
          >
            自适应
          </button>
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={src}
          alt={alt || ""}
          title={title || ""}
          className="w-full h-auto block rounded-xl"
          draggable={false}
        />

        {/* 宽度标签 */}
        <div className={`absolute bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-black/60 text-white text-[10px] rounded-full whitespace-nowrap transition-opacity ${selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
          {width || "自适应"}
        </div>

        {/* 右下角拖拽手柄 */}
        <div
          onPointerDown={(e) => { e.stopPropagation(); handleResize(e) }}
          className={`absolute -right-2 -bottom-2 w-8 h-8 bg-white border-2 border-blue-400 rounded-full shadow-md cursor-nwse-resize flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-30 ${selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
        >
          <div className="w-3 h-3 border-r-2 border-b-2 border-blue-400 rounded-br-sm" />
        </div>

        {/* 拖拽中指示 */}
        {resizing && (
          <div className="absolute inset-0 rounded-xl pointer-events-none" style={{ border: "2px dashed #3b82f6" }} />
        )}
      </div>
    </NodeViewWrapper>
  )
}