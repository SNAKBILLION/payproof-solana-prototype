import type { NextConfig } from "next";

const isGitHubPages = process.env.GITHUB_PAGES === "true";
const repositoryBasePath = "/payproof-solana-prototype";

const nextConfig: NextConfig = {
  output: isGitHubPages ? "export" : undefined,
  // Vinext's exporter requests the root RSC route directly. Keep the route at /
  // while prefixing emitted assets and browser-only public links for project Pages.
  basePath: "",
  assetPrefix: isGitHubPages ? repositoryBasePath : "",
  trailingSlash: isGitHubPages,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
