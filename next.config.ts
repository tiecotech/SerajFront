import type { NextConfig } from "next";

const API = process.env.API_INTERNAL_URL || "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  // Same-origin proxy to Laravel: Sanctum SPA cookies stay first-party, no CORS needed.
  async rewrites() {
    return [
      { source: "/backend/:path*", destination: `${API}/:path*` },
    ];
  },
  images: { unoptimized: true },
  poweredByHeader: false,
  // Separate output folder lets a verification build run beside a live server.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  experimental: { optimizePackageImports: ["recharts", "@dnd-kit/core", "@dnd-kit/sortable", "date-fns"] },
};

export default nextConfig;
