import { fileURLToPath } from 'node:url';
import type { NextConfig } from 'next';

// Pin the monorepo root so Next doesn't latch onto an unrelated lockfile higher
// up the filesystem (e.g. C:\Users\DELL\package-lock.json).
const monorepoRoot = fileURLToPath(new URL('../..', import.meta.url));

const config: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: monorepoRoot,
  transpilePackages: ['@souramail/ui', '@souramail/auth', '@souramail/db'],
  typedRoutes: true,
};

export default config;
