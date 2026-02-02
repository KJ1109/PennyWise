import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: 'export', // Removed for Web-Only Vercel Optimization
  images: {
    unoptimized: true
  },

};

export default nextConfig;
