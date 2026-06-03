import type { NextConfig } from "next";
import { siteConfig } from "./src/site.config";

const nextConfig: NextConfig = {
  output: "export",
  basePath: siteConfig.basePath,
  env: {
    NEXT_PUBLIC_BASE_PATH: siteConfig.basePath,
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
