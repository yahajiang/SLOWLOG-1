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
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
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
        // API 路由缓存
        source: '/api/posts',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=60, stale-while-revalidate=300' },
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