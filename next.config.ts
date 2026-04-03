import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  outputFileTracingRoot: process.cwd(),
  serverExternalPackages: ["longport", "longport-linux-x64-gnu"],
  outputFileTracingIncludes: {
    "/api/[[...route]]": [
      "./node_modules/longport-linux-x64-gnu/**/*",
      "./node_modules/.pnpm/longport-linux-x64-gnu@*/node_modules/longport-linux-x64-gnu/**/*",
      "./node_modules/longport/**/*"
    ]
  }
};

export default nextConfig;
