import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Evita que Turbopack tome por error la carpeta padre (hay otro pnpm-lock.yaml en APP ICURSO)
  turbopack: {
    root: path.join(__dirname),
  },
  serverExternalPackages: ["@sparticuz/chromium-min", "puppeteer-core"],
};

export default nextConfig;
