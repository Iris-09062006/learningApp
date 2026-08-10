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
} satisfies NextConfig;

export default nextConfig;
