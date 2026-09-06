import Link from "next/link";

// 404：纸面 + S 印章 + mono 数字 + 格言，与站点视觉语言同源
export default function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--yh-bg)] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center flex flex-col items-center gap-6">
        <span
          className="w-14 h-14 rounded-full bg-zinc-900 text-white flex items-center justify-center serif italic text-[20px] shadow-[0_10px_24px_rgba(0,0,0,0.16)] rotate-[-4deg]"
          aria-hidden
        >
          S
        </span>
        <div>
          <p className="mono text-[64px] leading-none font-semibold tracking-[0.1em] text-zinc-200 select-none">
            404
          </p>
          <h1 className="text-xl font-semibold text-[var(--yh-text)] mt-4">
            这一页还没有被写下
          </h1>
          <p className="text-sm text-[var(--yh-muted)] mt-2 leading-relaxed">
            您访问的页面不存在，或已被移动到别处。
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap justify-center">
          <Link
            href="/"
            className="px-6 py-2.5 bg-zinc-900 text-white text-[12px] tracking-[0.14em] uppercase hover:bg-[var(--yh-accent)] transition-colors min-h-[44px] flex items-center"
          >
            返回首页
          </Link>
          <Link
            href="/archive"
            className="px-6 py-2.5 border border-[var(--yh-border)] bg-[var(--dash-card)] text-[12px] tracking-[0.14em] uppercase text-[var(--yh-muted)] hover:text-[var(--yh-text)] hover:border-[var(--yh-muted)] transition-colors min-h-[44px] flex items-center"
          >
            去归档页
          </Link>
        </div>
        <p className="mono text-[11px] tracking-wide text-[var(--yh-muted)]/60 mt-2">
          慢下来，写点值得读的东西。
        </p>
      </div>
    </div>
  );
}
