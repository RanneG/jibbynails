import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  allowedDevOrigins: ["127.0.0.1"],
  async redirects() {
    return [{ source: "/gallery", destination: "/sets", permanent: true }];
  },
};

export default nextConfig;
