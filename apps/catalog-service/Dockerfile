# catalog-service — production image (npm workspaces monorepo)
#
# NOTE: build from the repository ROOT so the workspace lockfile is in context:
#   docker build -f apps/catalog-service/Dockerfile -t catalog-service .

# ─── Stage 1: builder — install full workspace and compile this service ──────
FROM node:24-alpine AS builder

# Toolchain for native addons (e.g. bcrypt).
RUN apk add --no-cache python3 make g++

WORKDIR /workspace

# Copy root manifests + every workspace manifest first so `npm ci` resolves the
# whole graph deterministically from the single root lockfile (better caching).
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/auth-service/package.json ./apps/auth-service/
COPY apps/catalog-service/package.json ./apps/catalog-service/
COPY apps/recommendation-service/package.json ./apps/recommendation-service/
COPY apps/review-service/package.json ./apps/review-service/
COPY apps/watchlist-service/package.json ./apps/watchlist-service/
COPY apps/gateway-service/package.json ./apps/gateway-service/
RUN npm ci

COPY tsconfig.base.json ./

# @cinescope/shared resolves through its package exports to ./dist, so it must
# be compiled before anything that imports it.
COPY packages/shared ./packages/shared
RUN npm run build -w @cinescope/shared

# Compile just this service. The Prisma client is generated, not committed, and
# tsc compiles it into dist. prisma.config.ts resolves DATABASE_URL on load, so
# generation needs a syntactically valid URL; nothing connects to it.
COPY apps/catalog-service ./apps/catalog-service
RUN DATABASE_URL=postgresql://build:build@localhost:5432/build npm run generate -w catalog-service
RUN npm run build -w catalog-service

# ─── Stage 2: prod-deps — production-only dependencies ───────────────────────
FROM node:24-alpine AS prod-deps

RUN apk add --no-cache python3 make g++

WORKDIR /workspace

COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/auth-service/package.json ./apps/auth-service/
COPY apps/catalog-service/package.json ./apps/catalog-service/
COPY apps/recommendation-service/package.json ./apps/recommendation-service/
COPY apps/review-service/package.json ./apps/review-service/
COPY apps/watchlist-service/package.json ./apps/watchlist-service/
COPY apps/gateway-service/package.json ./apps/gateway-service/
RUN npm ci --omit=dev

# ─── Stage 3: production — lean runtime image ────────────────────────────────
FROM node:24-alpine AS production

LABEL service="catalog-service"

RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

WORKDIR /app

COPY --from=prod-deps --chown=appuser:appgroup /workspace/node_modules ./node_modules
# node_modules/@cinescope/shared is a workspace symlink to ../../packages/shared:
# ship the package where it points. Node resolves it via `exports`, so only the
# manifest and the compiled output are needed.
COPY --from=builder --chown=appuser:appgroup /workspace/packages/shared/package.json ./packages/shared/package.json
COPY --from=builder --chown=appuser:appgroup /workspace/packages/shared/dist ./packages/shared/dist
COPY --from=builder --chown=appuser:appgroup /workspace/apps/catalog-service/dist ./dist
COPY --chown=appuser:appgroup apps/catalog-service/package.json ./package.json

USER appuser

EXPOSE 4002

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4002/health', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "dist/index.js"]
