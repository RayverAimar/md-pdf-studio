/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@md-pdf-studio/core", "@md-pdf-studio/render", "@md-pdf-studio/ui"],
  serverExternalPackages: ["puppeteer"],
};

export default nextConfig;
