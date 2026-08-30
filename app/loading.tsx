export default function Loading() {
  return (
    <div className="min-h-screen bg-[var(--yh-bg)] flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-sm text-zinc-500">加载中...</p>
      </div>
    </div>
  );
}
