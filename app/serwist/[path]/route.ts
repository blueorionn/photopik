import { createSerwistRoute } from '@serwist/turbopack'
// If you are using Next.js versions older than 15.0.0, add the
// `nextConfig` option so that Serwist can configure the service
// worker according to your options. Serwist 10 and newer will
// only support Next.js 15.0.0 and above.
// import nextConfig from "$cwd/next.config.mjs";

const revision = process.env.VERCEL_GIT_COMMIT_SHA ?? 'dev'

export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } =
  createSerwistRoute({
    additionalPrecacheEntries: [{ url: '/~offline', revision }],
    swSrc: 'app/sw.ts',
    // nextConfig,
    // If set to `false`, Serwist will attempt to use `esbuild-wasm`.
    useNativeEsbuild: true,
  })
