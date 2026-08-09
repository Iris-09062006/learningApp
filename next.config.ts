import type { NextConfig } from "next";

const nextConfig = {
  // CI runs the dedicated zero-warning lint gate before build. Next 15's
  // integrated lint runner is incompatible with this repository's flat config.
  eslint: {
    ignoreDuringBuilds: true,
  },
} satisfies NextConfig;

export default nextConfig;
