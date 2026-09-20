import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true
  },
  // GLB files in /public are served as static assets automatically.
  // No special webpack/turbopack config needed.
  turbopack: {},
};

export default nextConfig;
