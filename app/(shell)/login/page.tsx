import type { Metadata } from "next";
import { Suspense } from "react";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "登录",
  description: "慢日志后台登录",
  robots: { index: false, follow: false },
};

// ⚠️ 必须动态渲染。此前这页是 `○` 预渲染，而 LoginForm 里用了 useSearchParams()
// ⇒ 在 `<Suspense fallback={null}>` 下，服务端只吐出 **null**：初始 HTML 里连
// `<form>` 都没有，整张卡（品牌 + 两个输入框 + 按钮）要等 JS 水合才出现。
// 冷连接/慢包时就表现为「页面开了却输不了、刷新一下才正常」。
// 顺带修掉缓存语义：登录页原本带 s-maxage=60 + stale-while-revalidate≈1 年。
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
