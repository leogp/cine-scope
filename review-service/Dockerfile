# review-service — production image (npm workspaces monorepo)
#
# NOTE: build from the repository ROOT so the workspace lockfile is in context:
#   docker build -f review-service/Dockerfile -t review-service .

# ─── Stage 1: builder — install full workspace and compile this service ──────
FROM node:24-alpine AS builder

# Toolchain for native addons (e.g. bcrypt).
RUN apk add --no-cache python3 make g++

WORKDIR /workspace

# Copy root manifests + every workspace manifest first so `npm ci` resolves the
# whole graph deterministically from the single root lockfile (better caching).
COPY package.json package-lock.json ./
COPY auth-service/package.json ./auth-service/
COPY catalog-service/package.json ./catalog-service/
COPY recomendation-service/package.json ./recomendation-service/
COPY review-service/package.json ./review-service/
COPY watchlist-service/package.json ./watchlist-service/
COPY gateway-service/package.json ./gateway-service/
RUN npm ci

# Compile just this service.
COPY tsconfig.base.json ./
COPY review-service ./review-service
RUN npm run build -w review-service

# ─── Stage 2: prod-deps — production-only dependencies ───────────────────────
FROM node:24-alpine AS prod-deps

RUN apk add --no-cache python3 make g++

WORKDIR /workspace

COPY package.json package-lock.json ./
COPY auth-service/package.json ./auth-service/
COPY catalog-service/package.json ./catalog-service/
COPY recomendation-service/package.json ./recomendation-service/
COPY review-service/package.json ./review-service/
COPY watchlist-service/package.json ./watchlist-service/
COPY gateway-service/package.json ./gateway-service/
RUN npm ci --omit=dev

# ─── Stage 3: production — lean runtime image ────────────────────────────────
FROM node:24-alpine AS production

LABEL service="review-service"

RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

WORKDIR /app

COPY --from=prod-deps --chown=appuser:appgroup /workspace/node_modules ./node_modules
COPY --from=builder --chown=appuser:appgroup /workspace/review-service/dist ./dist
COPY --chown=appuser:appgroup review-service/package.json ./package.json

USER appuser

EXPOSE 4004

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4004/health', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "dist/index.js"]
