"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-[var(--yh-bg)] flex items-center justify-center p-4">
      <div className="max-w-md text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-zinc-900 mb-2">出错了</h1>
        <p className="text-sm text-zinc-500 mb-6">
          {error.message || "发生了未知错误，请稍后重试。"}
        </p>
        <button
          onClick={reset}
          className="px-6 py-2 bg-zinc-900 text-white text-sm tracking-widest uppercase hover:bg-zinc-700 transition-colors"
        >
          重试
        </button>
      </div>
    </div>
  );
}
