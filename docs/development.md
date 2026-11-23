# Development guide

CineScope is an **npm workspaces** monorepo. Shared dev tooling (`typescript`, `@types/node`, `eslint`, `prettier`, `jest`, `tsx`, …) lives in the root `package.json`, and each service declares only its own runtime dependencies. There is a single hoisted `node_modules` at the repository root.

Everything runs inside Docker. The workspace's `node_modules` is bind-mounted back to the host, so editors resolve every package without Node.js installed locally.

## Start the stack

```bash
docker compose up
```

On the first run the one-shot `deps` service installs the workspace, builds `@cinescope/shared`, generates the Prisma clients, applies migrations and seeds auth-service. Every service then starts with hot reload through `tsx watch`.

## File ownership

The Node containers run as UID/GID `1000:1000` rather than root, so everything they write into the repository (`node_modules`, `dist/`, generated Prisma clients) stays owned by you.

- **Linux:** if `id -u` or `id -g` is not 1000, copy `.env.example` to `.env` and set `UID` and `GID` there.
- **macOS:** nothing to do; Docker Desktop maps bind-mount files to your user.
- **Windows:** keep the repository inside the WSL2 filesystem, where it behaves like Linux.

Checkouts created before containers ran as your user may still hold root-owned files. Hand them back once (Linux or WSL2):

```bash
docker compose run --rm --no-deps --user root deps chown -R "$(id -u):$(id -g)" /workspace
```

## Adding a dependency

Install inside a container so nothing lands on the host:

```bash
docker compose exec auth-service npm install <package> -w auth-service   # one service
docker compose exec deps npm install -D <package>                         # shared dev tool
```

## Quality tooling

`tsconfig.base.json`, `eslint.config.js` and `.prettierrc` are defined once at the root and apply to every service.

```bash
docker compose run --rm deps npm run lint          # ESLint (type-aware)
docker compose run --rm deps npm run format:check  # Prettier, no writes
docker compose run --rm deps npm run typecheck     # tsc --noEmit per service
docker compose run --rm deps npm run build         # compile every service
```

To check a single file, for example the one you just edited:

```bash
scripts/check-file apps/catalog-service/src/domain/entities/series.ts
```

It formats the file with Prettier (writing it in place), lints it with ESLint and typechecks the project that covers it: the service's tests project for test files, its source project otherwise. It runs inside a service container that is already up, or in a throwaway `deps` container if none is.

## Tests

There are three kinds of suites:

- **Unit and HTTP tests** (`*.test.ts`): Jest and Supertest over in-memory fakes, with no infrastructure required.
- **Integration tests** (`*.int.test.ts`): code exercised against real infrastructure. Prisma repositories run against Postgres (`auth_test_db`, `catalog_test_db`, created automatically the first time the `postgres` volume is initialised); the gateway's rate limiter and response cache run against Redis, in logical database 15.
- **End-to-end tests** (`e2e/`, `*.e2e.test.ts`): the running system, entered only through the gateway. See [End-to-end tests](#end-to-end-tests).

```bash
docker compose run --rm --no-deps deps npm test                    # every service
docker compose run --rm --no-deps deps npm test -w auth-service    # one service
docker compose exec auth-service npm test                          # with the stack already up
```

`test:int` applies the service's migrations to its `*_test_db` and runs the integration suites serially. The connection string is baked into the script and names the test database only. `tests/helpers/testDb.ts` also refuses to build a client when `DATABASE_URL` does not name a test database, so a stray override cannot truncate development data. Keep dependencies enabled, since Compose has to start Postgres:

```bash
docker compose run --rm deps npm run test:int -w auth-service
docker compose run --rm deps npm run test:int -w catalog-service
```

### Gateway integration tests

`gateway-service`'s `test:int` builds two gateway apps in one process, each with its own Redis client, sharing one Redis: two replicas in miniature. The rate-limit suite gives each replica its own limiter and stores, checks that the limit holds across them, and a contrast case shows that in-memory stores would let twice the limit through. The response-cache suite checks that a response one replica stores is served by the other, and that a 2xx write through one makes the other miss. The script targets `redis://redis:6379/15`, a logical database development never uses (the gateway itself uses 0). `tests/helpers/testRedis.ts` refuses to connect unless the URL names database 15, and asks the server which database the connection selected before every `FLUSHDB`.

The `deps` service depends on Postgres only, so start Redis yourself and skip the other dependencies:

```bash
docker compose up -d redis
docker compose run --rm --no-deps deps npm run test:int -w gateway-service
```

### End-to-end tests

The `e2e/` workspace enters the system only through the gateway, as a client would, against the real gateway, auth-service, catalog-service, Postgres and Redis. It speaks plain HTTP through Node's `fetch` and imports nothing from the services, so it runs unchanged against any deployment of the gateway: only `E2E_BASE_URL` changes.

It checks what the gateway copies from the services, where a copy that drifts keeps every stub-based suite green:

| Contract                              | Checked by                                                                                       |
| ------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Access token secret and claims        | the seeded user's token creates a movie through the gateway and catalog; so does a refreshed one |
| Permission names in `ACCESS_POLICY`   | that create (201), and a newly signed-up user's 403                                              |
| Credential routes of the rate limiter | login and signup carry the `credentials` tier in `RateLimit-Policy`                              |
| Cacheable routes table                | every listed route answers 200 with `X-Cache`; `pageSize` changes the list; a `PUT` invalidates  |
| Prefix rewriting                      | each `/<prefix>/health` answers from the right service                                           |
| Error envelope                        | a gateway 404 and a catalog 404 share one shape                                                  |

It is not part of `npm test`. Run it with the stack up, from a container on the Compose network:

```bash
docker compose up -d
docker compose run --rm --no-deps -e E2E_BASE_URL=http://gateway-service:4000 deps npm run test:e2e -w e2e
```

A global setup runs once first: it waits up to `E2E_READY_TIMEOUT_MS` for `/health` on the gateway and on each proxied service through it, then logs in, signs up and creates the shared fixtures. Test files run serially, so cache assertions never interleave with another file's writes.

| Variable               | Default                 | Purpose                                                                |
| ---------------------- | ----------------------- | ---------------------------------------------------------------------- |
| `E2E_BASE_URL`         | `http://localhost:4000` | The gateway; the default is its published port, for runs from the host |
| `E2E_SEED_PASSWORD`    | `ChangeMe123!`          | The seeded user's password, the seed's own default                     |
| `E2E_READY_TIMEOUT_MS` | `120000`                | Upper bound on the readiness wait                                      |

**Seeded user.** The suite logs in as the user auth-service's seed creates. If the seed ran with `SEED_USER_PASSWORD` (in `apps/auth-service/.env`), pass the same value as `E2E_SEED_PASSWORD`; otherwise the seed's default applies to both.

**Cacheable routes.** The cache suite (`e2e/tests/cache.e2e.test.ts`) lists the gateway's `CACHEABLE_ROUTES` row by row instead of importing them, so that it stays black-box. A route added to that table needs its row in the e2e cache suite too, or it goes unchecked.

**Cache TTL.** Cache assertions poll for up to 5 s. The suite assumes a local `CACHE_TTL_MS` of at least a few seconds (the default is 30 s), so an entry cannot expire between being stored and being read back.

**Data.** Every run creates its own data and deletes nothing. Titles and names start with `e2e-<epoch ms>-`; the signed-up user's username is `e2e-<epoch ms>` and their email `e2e-<epoch ms>@e2e.cinescope.test`. Each run leaves one user, a few genres, a person, a company, a series and a handful of movies in the development databases, and no test assumes an empty database. If e2e data gets in the way, `docker compose down -v` resets the whole development environment (every database, Redis and RabbitMQ volume); the next `docker compose up` migrates and seeds from scratch.

**Credentials budget.** Each run makes three requests on the gateway's credentials tier: the seeded user's login, one signup and the new user's login. That tier allows `RATE_LIMIT_CREDENTIALS_MAX` requests (default 10) per 15 minutes per client IP, so a fourth run within the window fails in setup with a 429. To run the suite many times in a row, raise the limit for your local gateway only, leaving the defaults alone, and restart it (`tsx watch` does not reload `.env`):

```bash
echo 'RATE_LIMIT_CREDENTIALS_MAX=100' >> apps/gateway-service/.env
docker compose restart gateway-service
```

## Continuous integration

`.github/workflows/ci.yml` runs on every pull request to `main` and every push to `main`, as parallel jobs that report as separate checks:

| Job                             | Runs                                                    |
| ------------------------------- | ------------------------------------------------------- |
| Lint                            | `npm run lint` and `npm run format:check`               |
| Typecheck                       | `npm run typecheck`                                     |
| Unit tests                      | `npm test`                                              |
| Integration tests (per service) | `npm run test:int` against a Postgres service container |
| Integration tests (gateway)     | `npm run test:int` against a Redis service container    |
| End-to-end tests                | `npm run test:e2e -w e2e` against the Compose stack     |

Each job first goes through `.github/actions/setup-workspace`: `npm ci`, a build of `@cinescope/shared`, then `npm run generate` for the Prisma clients with a placeholder `DATABASE_URL` (no database is contacted). The Postgres integration jobs add a `postgres:16` service container holding only that service's `*_test_db`, and alias the `postgres` hostname that `test:int` targets to it. The gateway job does the same with a `redis:8.8-alpine` container and the `redis` hostname.

The end-to-end job does not go through `setup-workspace`: it runs the development stack itself, so everything installs inside the dev image. It writes a root `.env` with the runner's `UID` and `GID` (the runner user is not 1000, and the containers write `node_modules` into the checkout), and writes each service's `.env` with a random JWT access secret shared by auth-service, catalog-service and the gateway. It then runs `docker compose up -d`, which returns once `deps` has installed, migrated and seeded, and runs the suite in a `deps` container. On failure it prints every container's logs, grouped by service, and it always tears the stack down with its volumes. It is not a required check yet.

## `@cinescope/shared`

Framework-level building blocks, published to the workspace as three subpath exports. Each subpath has a thin shim package at `packages/shared/<subpath>/package.json` pointing at the compiled `dist/` output.

| Subpath                                 | Exports                                                                                                   |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `@cinescope/shared/domain`              | `Entity`, `AggregateRoot`, `ValueObject`, `DomainError`                                                   |
| `@cinescope/shared/application`         | `UseCase`, `PaginationParams`, `PaginatedResult`, `normalizePagination`, `buildPaginatedResult`           |
| `@cinescope/shared/infrastructure/http` | Express plumbing: validators, error and 404 handlers, health routes, authentication and permission guards |

The response envelopes are shared, while the error-to-status mapping stays in each service: every service passes its own `statusFor(err)` resolver to `buildErrorHandler`, because that mapping depends on its own error classes.

`express` and `zod` are **peer** dependencies. The services own the instances, because a duplicate copy of zod would break `instanceof ZodType` inside the validators.

npm workspaces already builds shared before the apps. A shared-only rebuild is:

```bash
docker compose run --rm --no-deps deps npm run build -w @cinescope/shared
```

## Production images

Each service ships a multi-stage `Dockerfile`. Because the workspace has a single lockfile, build from the repository root:

```bash
docker build -f apps/auth-service/Dockerfile -t cinescope/auth-service .
```
