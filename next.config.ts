import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Playwright drives a real browser from the server; it must not be bundled.
  serverExternalPackages: ["playwright", "playwright-core"],
};

export default nextConfig;
