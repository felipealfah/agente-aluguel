import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Raiz do monorepo (npm workspaces), evita inferir um lockfile fora do projeto.
  turbopack: { root: path.join(__dirname, "..") },
};

export default nextConfig;
