import type { NextConfig } from "next";

const nextConfig = {
  // CI runs the dedicated zero-warning lint gate before build. Next 15's
  // integrated lint runner is incompatible with this repository's flat config.
  eslint: {
    ignoreDuringBuilds: true,
  },
  // pdf-parse relies on a native canvas binding. Keep both packages out of the
  // Route Handler bundle so Vercel's file tracer includes the native runtime.
  serverExternalPackages: ["pdf-parse", "@napi-rs/canvas"],
  // @napi-rs/canvas resolves its platform package through a computed require.
  // Trace the Linux binding and parser assets explicitly for the one route that
  // performs PDF extraction so Vercel does not omit them from the function.
  outputFileTracingIncludes: {
    "/api/admin/content-sources/*/extract": [
      "node_modules/@napi-rs/canvas/**/*",
      "node_modules/@napi-rs/canvas-linux-x64-gnu/**/*",
      "node_modules/pdf-parse/**/*",
      "node_modules/pdfjs-dist/**/*",
    ],
  },
} satisfies NextConfig;

export default nextConfig;
