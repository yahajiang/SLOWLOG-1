import { readFileSync } from 'fs';
import withBundleAnalyzer from '@next/bundle-analyzer';
const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));
const analyzer = withBundleAnalyzer({ enabled: process.env.ANALYZE === 'true' });
/** @type {import('next').NextConfig} */
const nextConfig = {
  env: { NEXT_PUBLIC_APP_VERSION: pkg.version },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.public.blob.vercel-storage.com' },
      { protocol: 'https', hostname: '**.vercel-storage.com' },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30天
  },
  serverExternalPackages: ['@prisma/client', '@prisma/adapter-pg', 'prisma', 'sharp', 'bcryptjs'],
  // 启用压缩
  compress: true,
  // 生产环境优化
  productionBrowserSourceMaps: false,
  // 优化包大小
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{ kebabCase member }}',
    },
  },
  // 性能头
  async headers() {
    // P3-1：CSP。
    // 设计取舍：
    //  - script/style 保留 'unsafe-inline'/'unsafe-eval'：Next.js 的内联 bootstrap、
    //    主题首帧脚本与 React 的 style 属性都依赖它们；改用 nonce 需改造 middleware
    //    并逐个标注内联脚本，收益有限而回归风险高。
    //  - 真正的价值在其余指令：object-src/base-uri/frame-ancestors 关闭了
    //    <object> 注入、<base> 劫持与点击劫持三条攻击面，connect-src 收窄到
    //    同源可阻止被注入脚本把数据外传到攻击者域。
    //  - img-src 放开 https: 是刻意的：作者会在正文插入任意站点的外链图片，
    //    白名单化会导致这些图片直接不显示。
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "media-src 'self' blob: https:",
      "frame-src 'self' https:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join('; ');
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
        ],
      },
      {
        // 静态资源长缓存
        source: '/(.*)\\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },

      {
        // Dashboard list API - 列表数据，浏览器+CDN 都可缓存
        source: '/api/categories',
        headers: [
          { key: 'Cache-Control', value: 'private, max-age=30, stale-while-revalidate=120' },
        ],
      },
      {
        source: '/api/thoughts',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=30, stale-while-revalidate=60' },
        ],
      },
      {
        source: '/api/media',
        headers: [
          { key: 'Cache-Control', value: 'private, max-age=60, stale-while-revalidate=120' },
        ],
      },
    ]
  },
}

export default analyzer(nextConfig)