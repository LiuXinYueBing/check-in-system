/** @type {import('next').NextConfig} */
const nextConfig = {
  // Capacitor 静态导出配置
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },

  // 优化 Vercel 部署
  experimental: {
    // 减少包大小
    optimizePackageImports: ['html5-qrcode', 'lucide-react']
  },

  // 配置 webpack
  webpack: (config, { isServer }) => {
    // html5-qrcode 需要在客户端运行
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }

    return config;
  },

  // 环境变量
  env: {
    NEXT_PUBLIC_VERCEL_ENV: process.env.VERCEL_ENV || 'development'
  },

  // 排除不需要的页面
  excludeDefaultMomentLocales: true,
  distDir: 'out-app',
}

module.exports = nextConfig