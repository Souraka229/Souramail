# Build context = repo root:  docker build -f apps/worker/Dockerfile -t souramail-worker .
FROM node:22-slim AS base
ENV PNPM_HOME=/pnpm PATH="/pnpm:$PATH"
RUN corepack enable
WORKDIR /repo

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/worker/package.json apps/worker/
COPY packages/db/package.json packages/db/
COPY packages/core/package.json packages/core/
COPY packages/contracts/package.json packages/contracts/
COPY packages/providers/package.json packages/providers/
RUN pnpm install --frozen-lockfile --ignore-scripts --filter @souramail/worker...

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/apps/worker/node_modules ./apps/worker/node_modules
COPY package.json pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/ packages/
COPY apps/worker/ apps/worker/
WORKDIR /repo/apps/worker
USER node
CMD ["node", "--experimental-strip-types", "src/index.ts"]
