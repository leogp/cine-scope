# watchlist-service — production image (npm workspaces monorepo)
#
# NOTE: build from the repository ROOT so the workspace lockfile is in context:
#   docker build -f apps/watchlist-service/Dockerfile -t watchlist-service .

# ─── Stage 1: builder — install full workspace and compile this service ──────
FROM node:24-alpine AS builder

# Toolchain for native addons (e.g. bcrypt).
RUN apk add --no-cache python3 make g++

WORKDIR /workspace

# Copy root manifests + every workspace manifest first so `npm ci` resolves the
# whole graph deterministically from the single root lockfile (better caching).
COPY package.json package-lock.json ./
COPY apps/auth-service/package.json ./apps/auth-service/
COPY apps/catalog-service/package.json ./apps/catalog-service/
COPY apps/recomendation-service/package.json ./apps/recomendation-service/
COPY apps/review-service/package.json ./apps/review-service/
COPY apps/watchlist-service/package.json ./apps/watchlist-service/
COPY apps/gateway-service/package.json ./apps/gateway-service/
RUN npm ci

# Compile just this service.
COPY tsconfig.base.json ./
COPY apps/watchlist-service ./apps/watchlist-service
RUN npm run build -w watchlist-service

# ─── Stage 2: prod-deps — production-only dependencies ───────────────────────
FROM node:24-alpine AS prod-deps

RUN apk add --no-cache python3 make g++

WORKDIR /workspace

COPY package.json package-lock.json ./
COPY apps/auth-service/package.json ./apps/auth-service/
COPY apps/catalog-service/package.json ./apps/catalog-service/
COPY apps/recomendation-service/package.json ./apps/recomendation-service/
COPY apps/review-service/package.json ./apps/review-service/
COPY apps/watchlist-service/package.json ./apps/watchlist-service/
COPY apps/gateway-service/package.json ./apps/gateway-service/
RUN npm ci --omit=dev

# ─── Stage 3: production — lean runtime image ────────────────────────────────
FROM node:24-alpine AS production

LABEL service="watchlist-service"

RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

WORKDIR /app

COPY --from=prod-deps --chown=appuser:appgroup /workspace/node_modules ./node_modules
COPY --from=builder --chown=appuser:appgroup /workspace/apps/watchlist-service/dist ./dist
COPY --chown=appuser:appgroup apps/watchlist-service/package.json ./package.json

USER appuser

EXPOSE 4005

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4005/health', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "dist/index.js"]
