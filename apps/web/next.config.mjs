/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@md-pdf-studio/core", "@md-pdf-studio/render", "@md-pdf-studio/ui"],
  // Hide Next's dev-only on-screen indicator (the floating "N" badge); it overlaps the controls dock.
  devIndicators: false,
  // pdf.js resolves its worker module at runtime via createRequire; bundling rewrites that path to a
  // virtual one the loader can't import, so it must load from node_modules instead.
  serverExternalPackages: ["puppeteer", "pdfjs-dist"],
};

export default nextConfig;
