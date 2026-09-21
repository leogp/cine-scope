# Roadmap

Development plan for CineScope, organized by phase. Each item is developed on its own branch following the `<scope>/<topic>` convention used throughout the repository, then merged into `main`.

Scope is deliberately kept narrow: the goal is to exercise microservice patterns end to end, not to build an exhaustive feature set. Movie is the only aggregate with a full CRUD surface — it is enough to demonstrate the write path, and the remaining aggregates expose create and read on purpose.

## Phase 1 — Architecture

- [x] `chore/namespaces`
- [x] `chore/architecture-cleanup`
- [x] `packages/shared` — entity, aggregate root, value object, domain event, use case, pagination, HTTP plumbing
- [x] `setup/prisma`
- [x] `auth/domain` — user, role, permission, refresh token
- [x] `auth/application`
- [x] `auth/infrastructure` — Prisma repositories, bcrypt hasher, JWT generators, seed
- [x] `auth/http`
- [x] `auth/tests`
- [x] `catalog/domain`
- [x] `catalog/application`
- [x] `catalog/infrastructure`
- [x] `auth/authorization` — expose permissions in the access token payload, add `requirePermission` to `@cinescope/shared/infrastructure/http`, enforce `catalog:write` on catalog write routes
- [ ] `chore/ci-pipeline` — lint, typecheck and unit tests on every PR
- [ ] `chore/recommendation-rename` — fix the `recomendation-service` spelling across folder, package, container and env vars, before it reaches queue names and Kubernetes manifests

## Phase 2 — Gateway

- [ ] `gateway/proxy`
- [ ] `gateway/auth`
- [ ] `gateway/jwt-propagation`
- [ ] `gateway/authorization`
- [ ] `gateway/composition`
- [ ] `gateway/rate-limiting`
- [ ] `gateway/cache`
- [ ] `gateway/tests`

## Phase 3 — Engagement service

Reviews and watchlists are two aggregates of the same bounded context — how a user interacts with the catalog — so they are implemented as a single service rather than two. Access control here is ownership-based: a user may only modify their own reviews and watchlist entries, which is a different check from the role and permission model that guards the catalog.

- [ ] `chore/engagement-merge` — consolidate the review and watchlist placeholders into `engagement-service`, with its own database, port and Compose entry
- [ ] `engagement/domain` — review and watchlist entry aggregates
- [ ] `engagement/application`
- [ ] `engagement/infrastructure`
- [ ] `engagement/http`
- [ ] `engagement/authorization` — ownership enforcement on top of the `reviews:write`, `reviews:moderate` and `watchlist:manage` permissions
- [ ] `engagement/tests`

## Phase 4 — Recommendation service

- [ ] `catalog/domain-events` — record `MovieCreated` / `MovieUpdated` / `MovieDeleted` on the aggregate
- [ ] `packages/shared-messaging` — RabbitMQ connection, publisher and consumer building blocks
- [ ] `catalog/messaging` — publish recorded domain events
- [ ] `recommendation/domain`
- [ ] `recommendation/application`
- [ ] `recommendation/infrastructure` — Prisma repositories and event consumer
- [ ] `recommendation/tests`

## Phase 5 — Closing

- [ ] `catalog/outbox`
- [ ] `recommendation/inbox`
- [ ] `recommendation/retry`
- [ ] `recommendation/dead-letter`
- [ ] `infra/k8s`

## Phase 6 — OAuth 2.0

Authentication currently relies on self-issued JWTs and rotating refresh tokens. OAuth 2.0 and OpenID Connect are layered on top once the platform is complete.

- [ ] `auth/oauth2-authorization-code`
- [ ] `auth/oidc`
- [ ] `gateway/oauth2`

## Architecture Decision Records

Design decisions are documented as they are made, independently of the phase they belong to.

- [ ] `docs/adr-jwt-propagation` — note the interim decision made in `auth/authorization`: catalog-service verifies the access token itself (JWT secret in its own env), since the gateway does not exist yet; once `gateway/jwt-propagation` lands, this check is kept as defense-in-depth rather than removed
- [ ] `docs/adr-engagement-bounded-context`
- [ ] `docs/adr-outbox`
- [ ] `docs/adr-db-per-service-minikube`
