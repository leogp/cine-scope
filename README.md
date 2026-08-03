# CineScope

CineScope is a cloud-native movie and TV platform built with a microservices architecture.

The platform is designed around Domain-Driven Design (DDD), Clean Architecture and event-driven communication principles. Each bounded context is implemented as an independent service with its own database and deployment lifecycle.

## Architecture

CineScope is composed of multiple backend services:

- **Auth Service**
- **Catalog Service**
- **Review Service**
- **Watchlist Service**
- **Recommendation Service**
- **API Gateway**

Services communicate synchronously through REST APIs and asynchronously through events.

## Tech Stack

### Backend

- Node.js
- TypeScript
- Express

### Data

- PostgreSQL
- Redis

### Messaging

- RabbitMQ

### Infrastructure

- Docker
- Docker Compose
- Kubernetes
- Minikube

## Security

- JWT Access Tokens
- Refresh Tokens
- OAuth 2.0 Authorization Code Flow
- OpenID Connect (OIDC)
- Role-Based Access Control (RBAC)
- Token-based Authentication

## Testing

- Jest
- Supertest

## Architectural Principles

- Microservices-first approach
- Domain-Driven Design (DDD)
- Clean Architecture
- Hexagonal Architecture
- Event-Driven Architecture
- Database per Service
- Eventual Consistency

## Repository layout

```
apps/
  auth-service/            signup, login, refresh, logout (implemented)
  catalog-service/         movies, series, people, genres, companies (implemented)
  review-service/          scaffolding
  watchlist-service/       scaffolding
  recomendation-service/   scaffolding
  gateway-service/         scaffolding
packages/
  shared/                  @cinescope/shared — building blocks used by every service
infra/                     compose/database/messaging assets
```

Each implemented service follows the same Clean Architecture layering:

```
apps/<service>/
  src/
    domain/          entities, value objects, repository interfaces, errors
    application/     use cases (one folder per use case: request, response, use case)
    infrastructure/
      http/          app.ts, controllers/, routes/, middlewares/, schemas/
      prisma/        repository implementations + domain↔row mappers
    main/            composition.ts — the composition root
    config/          env parsing
    index.ts         dotenv → env → buildApp(composeApp()) → listen
  tests/             mirrors src/, plus fakes/ and helpers/
```

## `@cinescope/shared`

Framework-level building blocks, published to the workspace as three subpath
exports. Each subpath has a thin shim package at
`packages/shared/<subpath>/package.json` pointing at the compiled `dist/`
output, so services import them as ordinary module specifiers.

| Subpath                                 | Exports                                                                                                                        |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `@cinescope/shared/domain`              | `Entity`, `AggregateRoot`, `ValueObject`, `DomainError`                                                                        |
| `@cinescope/shared/application`         | `UseCase`, `PaginationParams`, `PaginatedResult`, `normalizePagination`, `buildPaginatedResult`                                |
| `@cinescope/shared/infrastructure/http` | `asyncHandler`, `validateBody`, `validateParams`, `validateQuery`, `notFoundHandler`, `buildHealthRoutes`, `buildErrorHandler` |

`infrastructure/http` holds the Express plumbing that is genuinely
service-agnostic — the response envelopes (`{error, message}`,
`{error: 'ValidationError', details}`, `{error: 'NotFound', path}`) and the
500 fallback. What stays per-service is the **policy**: each service passes
its own `statusFor(err)` resolver to `buildErrorHandler`, because the
error→status mapping depends on that service's error classes.

```ts
// apps/catalog-service/src/infrastructure/http/middlewares/errorHandler.ts
export const errorHandler = buildErrorHandler(statusFor)
```

`express` and `zod` are **peer** dependencies, not direct ones: the services
own the instances. A duplicate copy of zod would break `instanceof ZodType`
inside `validateBody` and friends.

Shared compiles to `dist/` before the apps — npm workspaces already orders the
build correctly, but a shared-only rebuild is:

```bash
docker compose run --rm --no-deps deps npm run build -w @cinescope/shared
```

## Development

CineScope is an **npm workspaces** monorepo. All shared dev tooling
(`typescript`, `@types/node`, `eslint`, `prettier`, `jest`, `tsx`, …) lives in
the root `package.json`; each service only declares its own runtime
dependencies. There is a **single hoisted `node_modules` at the repo root**.

You do **not** need Node.js installed on your host. Everything runs inside
Docker, and the workspace's `node_modules` is bind-mounted back to the host so
your editor resolves every package with no red squiggles.

### Requirements

- Docker + Docker Compose

### Start the stack

```bash
docker compose up
```

On the first run the one-shot `deps` service runs `npm install` for the whole
workspace (populating the shared `node_modules` on the host), then every
service starts with hot-reload via `tsx watch`.

### Adding a dependency to a service

Run the install **inside a container** so nothing is installed on your host.
The change lands in the shared `node_modules` immediately and VS Code picks it
up right away:

```bash
docker compose exec auth-service npm install <package> -w auth-service
```

For a dev-only tool shared by every service, add it at the workspace root:

```bash
docker compose exec deps npm install -D <package>
# (or run `docker compose run --rm deps npm install -D <package>`)
```

### Quality tooling (shared across all services)

`tsconfig.base.json`, `eslint.config.js` and `.prettierrc` are defined once at
the root and apply to every service.

```bash
docker compose run --rm deps npm run lint        # ESLint (type-aware)
docker compose run --rm deps npm run typecheck    # tsc --noEmit per service
docker compose run --rm deps npm run build        # compile every service
```

### Running tests

Like everything else, tests run **inside containers** — no Node.js needed on
the host. There are two kinds of suites:

- **Unit / HTTP tests** (`*.test.ts`) — pure Jest + Supertest over in-memory
  fakes, no infrastructure required.
- **Integration tests** (`*.int.test.ts`) — Prisma repositories exercised
  against a real Postgres database (`auth_test_db` / `catalog_test_db`, both
  created automatically the first time the `postgres` volume is initialised).

#### Unit tests

Run the whole workspace through a one-off `deps` container (`--no-deps` skips
starting Postgres and friends, which unit tests don't need):

```bash
docker compose run --rm --no-deps deps npm test                    # every service
docker compose run --rm --no-deps deps npm test -w auth-service    # one service
```

If the stack is already running (`docker compose up`), exec into the service
container instead:

```bash
docker compose exec auth-service npm test
```

#### Integration tests

`test:int` applies the service's migrations to its `*_test_db` and then runs
the `*.int.test.ts` suites serially against it. The connection string is baked
into the script and targets the test database only, so the development
`auth_db` / `catalog_db` are never touched — and `tests/helpers/testDb.ts`
refuses to build a client at all if `DATABASE_URL` does not name a test
database, so a stray override cannot truncate real data. It needs Postgres, so
keep dependencies enabled — Compose starts Postgres and waits for it to be
healthy:

```bash
docker compose run --rm deps npm run test:int -w auth-service
docker compose run --rm deps npm run test:int -w catalog-service
# or, with the stack already up:
docker compose exec auth-service npm run test:int
```

### Production images

Each service ships a multi-stage `Dockerfile`. Because of the single workspace
lockfile, build them from the repository **root**:

```bash
docker build -f apps/auth-service/Dockerfile -t cinescope/auth-service .
```

> Note: when Prisma schemas are added, give each service its own generated
> client `output` path so the hoisted `node_modules` clients don't collide.

## Current Status

Platform infrastructure — Docker environment, container orchestration,
messaging, database and cache services — is in place, and two business
services are implemented end to end:

| Service                | Status                                                                                      |
| ---------------------- | ------------------------------------------------------------------------------------------- |
| Auth Service           | Implemented — signup, login, refresh, logout; Prisma repositories; HTTP + integration tests |
| Catalog Service        | Implemented — movie/series/person/genre/company aggregates; Prisma repositories; HTTP tests |
| Review Service         | Scaffolding                                                                                 |
| Watchlist Service      | Scaffolding                                                                                 |
| Recommendation Service | Scaffolding                                                                                 |
| API Gateway            | Scaffolding                                                                                 |

The remaining services will be introduced incrementally.

### Auth Service API

| Route                | Success                   |
| -------------------- | ------------------------- |
| `POST /auth/signup`  | 201                       |
| `POST /auth/login`   | 200 — token pair          |
| `POST /auth/refresh` | 200 — rotated token pair  |
| `POST /auth/logout`  | 204                       |
| `GET /health`        | 200 — `{status, service}` |

### Catalog Service API

Movies are the only aggregate with a full CRUD surface; the rest expose
create + read while the write use cases are built out.

| Route                                   | Success                              |
| --------------------------------------- | ------------------------------------ |
| `POST /movies`                          | 201 — `{id}`                         |
| `GET /movies?page&pageSize`             | 200 — paginated summaries            |
| `GET /movies/:id`                       | 200 — full read model with relations |
| `PUT /movies/:id`                       | 200 — `{id}` (full replace)          |
| `DELETE /movies/:id`                    | 204                                  |
| `POST /series`, `GET /series/:id`       | 201 / 200                            |
| `POST /people`, `GET /people/:id`       | 201 / 200                            |
| `POST /genres`, `GET /genres/:id`       | 201 / 200                            |
| `POST /companies`, `GET /companies/:id` | 201 / 200                            |
| `GET /health`                           | 200 — `{status, service}`            |

Error responses follow the shared envelope: `400` for schema failures
(`{error: 'ValidationError', details}`) and for domain invariant violations,
`404` for a missing aggregate or an unresolvable relation id, `409` for a
duplicate genre name, `500` (`{error: 'InternalServerError'}`, message
withheld) for anything unmapped.

## Planned Features

- Authentication and authorization
- Movie and TV catalog
- Ratings and reviews
- Favorites and watchlists
- Recommendations
- API Gateway
- Event-driven communication
- Outbox Pattern
- Saga Pattern
- Kubernetes deployment

## License

This project is released under the MIT License.
