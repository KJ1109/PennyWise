import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // output: 'export', // Disabled to allow Dynamic Server Routes (SSR) for Auth
    images: {
        unoptimized: true
    },

};

export default nextConfig;
