import * as path from "node:path";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@cloudigniter/core",
    "@cloudigniter/aws",
    "@cloudigniter/next",
  ],
  reactStrictMode: true,
  turbopack: {
    root: path.resolve(__dirname, "../.."),
  },
};

// export default nextConfig;
const withNextIntl = createNextIntlPlugin(
  "./src/kernel/server/i18n/request.ts",
);
export default withNextIntl(nextConfig);
