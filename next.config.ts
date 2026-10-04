import type { NextConfig } from 'next'

const CDN_HOST = new URL(process.env.CDN_HOST!).hostname

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    remotePatterns: [{ protocol: 'https', hostname: CDN_HOST }],
  },
}

export default nextConfig
