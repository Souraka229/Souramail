# Build context = repo root:  docker build -f apps/api/Dockerfile -t souramail-api .
FROM node:22-slim AS base
ENV PNPM_HOME=/pnpm PATH="/pnpm:$PATH"
RUN corepack enable
WORKDIR /repo

# ─── deps: install the whole workspace (cached on lockfile) ─────────────────
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/
COPY packages/db/package.json packages/db/
COPY packages/core/package.json packages/core/
COPY packages/contracts/package.json packages/contracts/
COPY packages/providers/package.json packages/providers/
RUN pnpm install --frozen-lockfile --ignore-scripts --filter @souramail/api...

# ─── runtime ──────────────────────────────────────────────────────────────
FROM base AS runtime
ENV NODE_ENV=production
COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/apps/api/node_modules ./apps/api/node_modules
COPY package.json pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/ packages/
COPY apps/api/ apps/api/
WORKDIR /repo/apps/api
EXPOSE 4000
USER node
CMD ["node", "--experimental-strip-types", "src/server.ts"]
