import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--yh-bg)] flex items-center justify-center p-4">
      <div className="max-w-md text-center">
        <h1 className="text-6xl font-semibold text-zinc-200 mb-4">404</h1>
        <h2 className="text-xl font-semibold text-zinc-900 mb-2">页面未找到</h2>
        <p className="text-sm text-[var(--yh-muted)] mb-6">
          您访问的页面不存在或已被移动。
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-2 bg-zinc-900 text-white text-sm tracking-widest uppercase hover:bg-zinc-700 transition-colors"
        >
          返回首页
        </Link>
      </div>
    </div>
  );
}
