/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Disable Turbopack for compatibility with the sandbox environment
  experimental: {},
};

module.exports = nextConfig;
