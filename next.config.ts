import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export', // Enabled for Capacitor (Mobile) Static Build
  images: {
    unoptimized: true
  },

};

export default nextConfig;
