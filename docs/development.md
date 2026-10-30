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

## Tests

There are two kinds of suites:

- **Unit and HTTP tests** (`*.test.ts`): Jest and Supertest over in-memory fakes, with no infrastructure required.
- **Integration tests** (`*.int.test.ts`): Prisma repositories exercised against a real Postgres database (`auth_test_db`, `catalog_test_db`), created automatically the first time the `postgres` volume is initialised.

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

## Continuous integration

`.github/workflows/ci.yml` runs on every pull request to `main` and every push to `main`, as parallel jobs that report as separate checks:

| Job                             | Runs                                                    |
| ------------------------------- | ------------------------------------------------------- |
| Lint                            | `npm run lint` and `npm run format:check`               |
| Typecheck                       | `npm run typecheck`                                     |
| Unit tests                      | `npm test`                                              |
| Integration tests (per service) | `npm run test:int` against a Postgres service container |

Each job first goes through `.github/actions/setup-workspace`: `npm ci`, a build of `@cinescope/shared`, then `npm run generate` for the Prisma clients with a placeholder `DATABASE_URL` (no database is contacted). The integration jobs add a `postgres:16` service container holding only that service's `*_test_db`, and alias the `postgres` hostname that `test:int` targets to it.

## `@cinescope/shared`

Framework-level building blocks, published to the workspace as three subpath exports. Each subpath has a thin shim package at `packages/shared/<subpath>/package.json` pointing at the compiled `dist/` output.

| Subpath                                 | Exports                                                                                                    |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `@cinescope/shared/domain`              | `Entity`, `AggregateRoot`, `ValueObject`, `DomainError`                                                    |
| `@cinescope/shared/application`         | `UseCase`, `PaginationParams`, `PaginatedResult`, `normalizePagination`, `buildPaginatedResult`            |
| `@cinescope/shared/infrastructure/http` | Express plumbing: validators, error and 404 handlers, health routes, authentication and permission guards  |

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
