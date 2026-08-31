import type { NextConfig } from 'next';

const config: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@souramail/ui'],
  experimental: { typedRoutes: true },
};

export default config;
