import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // curriculum.json / candidates.json are read from disk at runtime. Without
  // this, Vercel's file tracing leaves them out of the bundle and the route
  // 404s on data in production while working fine locally.
  outputFileTracingIncludes: {
    "/api/**/*": ["./data/**/*"],
  },
};

export default nextConfig;
