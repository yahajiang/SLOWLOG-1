/**
 * ESLint 平面配置（N-5 · docs/audit-2026-09-15-independent.md）。
 *
 * 本仓此前**没有任何 lint 门禁**（CI 只跑 tsc + npm audit + build）。上一轮审查发现的
 * 两类问题——hooks 规则违反（P2-8）与死代码/未用变量（P2-4、P3-22）——本应由工具在
 * 提交时拦截，而不是每次靠人眼重扫一百多个源文件。
 *
 * 刻意**最小化**：只装 typescript-eslint + react-hooks，不引入 eslint-config-next 全家桶
 * （import / jsx-a11y / react 插件会带来大量告警噪音，反而让门禁被无视）。
 * 扫描范围仅 app/ components/ lib/ + middleware.ts；scripts/ 是一次性运维脚本，
 * 不进构建产物且风格债大，暂不纳入（需要时再收）。
 */
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";

export default tseslint.config(
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "lib/generated/**", // Prisma 生成物
      "scripts/**", // 一次性运维脚本，暂不纳入门禁
      // ⚠️ 必须忽略 worktrees：里面每个 worktree 都有自己的 .next/ 与 lib/generated/
      // 构建产物，不加这条会把 2.6 万条生成代码噪音扫进来（实测）。
      ".worktrees/**",
      "public/**",
      "mobile-preview/**",
      "backups/**",
      "content-export/**",
      "next-env.d.ts",
      "*.config.mjs",
      "*.config.js",
    ],
  },
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    plugins: { "react-hooks": reactHooks },
    rules: {
      // ── 本轮开门的两条硬规则 ──────────────────────────────────────
      // 上一轮修的 P2-8 就是这类（useLang 写进 try/catch），此规则可直接拦截
      "react-hooks/rules-of-hooks": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        // 下划线开头视为有意保留；catch 的异常变量常为占位（e: any），不告警
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrors: "none" },
      ],

      // ── 渐进收紧：先关闭与现状冲突面过大的规则，避免一次性红墙 ────
      // 全仓大量 `as any`（Prisma JSON 字段 / Tiptap 动态内容），逐类清偿后再开
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-empty-object-type": "off",
    },
  }
);
