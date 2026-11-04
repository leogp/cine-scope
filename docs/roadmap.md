# Roadmap

Development plan for CineScope, organized by phase. Each item is developed on its own branch following the `<scope>/<topic>` convention used throughout the repository, then merged into `main`.

Scope is deliberately kept narrow: the goal is to exercise microservice patterns end to end, not to build an exhaustive feature set. Movie and Series are the aggregates with a full CRUD surface, because they are the ones other services consume through events; people, genres and companies expose create and read on purpose.

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
- [x] `chore/ci-pipeline` — lint, typecheck and unit tests on every PR
- [x] `chore/recommendation-rename` — fix the `recomendation-service` spelling across folder, package, container and env vars, before it reaches queue names and Kubernetes manifests

## Phase 2 — Gateway

- [x] `gateway/proxy`
- [x] `gateway/auth`
- [x] `gateway/jwt-propagation` — [ADR 0001](adr/0001-jwt-propagation.md): the gateway forwards the caller's access token unchanged; catalog-service's own check, introduced in `auth/authorization` before the gateway existed, is kept as defense in depth
- [x] `fix/inactive-users` — reject login and token refresh for inactive users
- [x] `gateway/authorization`
- [ ] `gateway/rate-limiting`
- [ ] `gateway/cache`
- [ ] `gateway/tests`

## Phase 3 — Event-driven integration

Catalog publishes the lifecycle of its movies as domain events, and recommendation-service builds its own projection of the catalog from them. Because that projection is fed by events alone, a lost event is a permanent divergence, so delivery is made reliable end to end: an outbox on the producer side, an inbox on the consumer side to absorb at-least-once redeliveries, retries for transient failures and a dead-letter queue for messages that keep failing.

- [ ] `catalog/series-crud` — list, update and delete for series, renaming `MovieTitle` to `Title` now that both aggregates use it
- [ ] `catalog/domain-events` — record `MovieCreated` / `MovieUpdated` / `MovieDeleted` and `SeriesCreated` / `SeriesUpdated` / `SeriesDeleted`, with an event id on every domain event; deletion goes through the aggregate so that the deleted event can be recorded. The remaining aggregates publish no events until a consumer needs them
- [ ] `packages/shared-messaging` — RabbitMQ connection, publisher with confirms and consumer building blocks
- [ ] `catalog/outbox` — persist recorded events in an outbox table, in the same transaction as the aggregate
- [ ] `catalog/messaging` — relay that publishes pending outbox events and marks them as published
- [ ] `recommendation/domain`
- [ ] `recommendation/application`
- [ ] `recommendation/infrastructure` — own database, Prisma repositories, movie projection and event consumer
- [ ] `recommendation/http` — recommendations for a given movie or series
- [ ] `recommendation/inbox` — deduplicate deliveries by event id
- [ ] `recommendation/retry`
- [ ] `recommendation/dead-letter`
- [ ] `recommendation/tests`

## Phase 4 — Engagement service

Reviews and watchlists are two aggregates of the same bounded context — how a user interacts with the catalog — so they are implemented as a single service rather than two. Access control here is ownership-based: a user may only modify their own reviews and watchlist entries, which is a different check from the role and permission model that guards the catalog.

Engagement is built on the messaging infrastructure from Phase 3. It keeps its own projection of catalog movies, validates movie references against it and removes orphaned reviews and watchlist entries when a movie is deleted.

- [ ] `chore/engagement-merge` — consolidate the review and watchlist placeholders into `engagement-service`, with its own database, port and Compose entry
- [ ] `engagement/domain` — review and watchlist entry aggregates, targeting either a movie or a series
- [ ] `engagement/application`
- [ ] `engagement/infrastructure` — Prisma repositories and movie projection
- [ ] `engagement/messaging` — consume the created and deleted events of movies and series; the inbox and retry building blocks move into `packages/shared-messaging` now that a second consumer needs them
- [ ] `engagement/http`
- [ ] `engagement/authorization` — ownership enforcement on top of the `reviews:write`, `reviews:moderate` and `watchlist:manage` permissions
- [ ] `engagement/tests`
- [ ] `gateway/composition` — movie detail composed from catalog, engagement and recommendation

## Phase 5 — Deployment

- [ ] `infra/k8s`

## Phase 6 — Token security and OAuth 2.0

Access tokens are currently signed with a shared secret that every verifying service holds. They move first to asymmetric keys published through JWKS, and OAuth 2.0 and OpenID Connect are then layered on top.

- [ ] `packages/shared-jwks` — token verifiers accept a remote JWKS as well as a shared secret
- [ ] `auth/jwks` — RS256 key pair and a `/.well-known/jwks.json` endpoint
- [ ] `chore/jwks-cutover` — auth-service signs with RS256; every verifying service checks tokens against its JWKS and drops `JWT_ACCESS_SECRET`
- [ ] `auth/oauth2-authorization-code`
- [ ] `auth/oidc`
- [ ] `gateway/oauth2`

## Architecture Decision Records

Design decisions are documented as they are made, independently of the phase they belong to.

- [x] `docs/adr-jwt-propagation`
- [ ] `docs/adr-asymmetric-tokens` — ADR 0002, superseding the shared-secret consequences of ADR 0001
- [ ] `docs/adr-outbox`
- [ ] `docs/adr-engagement-bounded-context` — including its consistency model with the catalog
- [ ] `docs/adr-db-per-service-minikube`
