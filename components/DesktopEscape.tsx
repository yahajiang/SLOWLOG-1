"use client";

/** 平板树逃生口：切回桌面版（种 view=desktop 并跳转对应桌面路径） */
export function DesktopEscape({ desktopPath }: { desktopPath: string }) {
  return (
    <a
      href={desktopPath}
      onClick={(e) => {
        e.preventDefault();
        document.cookie = "view=desktop; path=/; max-age=31536000; samesite=lax";
        window.location.replace(desktopPath);
      }}
      className="mono text-[10px] tracking-[0.18em] uppercase text-[var(--yh-muted)]/60 hover:text-[var(--yh-text)] transition-colors"
    >
      桌面版
    </a>
  );
}
