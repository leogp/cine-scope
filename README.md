# CineScope

CineScope is a cloud-native movie and TV platform built with a microservices architecture.

The platform is designed around Domain-Driven Design (DDD), Clean Architecture and event-driven communication principles. Each bounded context is implemented as an independent service with its own database and deployment lifecycle.

## Architecture

CineScope is composed of multiple backend services:

* **Auth Service**
* **Catalog Service**
* **Review Service**
* **Watchlist Service**
* **Recommendation Service**
* **API Gateway**

Services communicate synchronously through REST APIs and asynchronously through events.

## Tech Stack

### Backend

* Node.js
* TypeScript
* Express

### Data

* PostgreSQL
* Redis

### Messaging

* RabbitMQ

### Infrastructure

* Docker
* Docker Compose
* Kubernetes
* Minikube

## Security

- JWT Access Tokens
- Refresh Tokens
- OAuth 2.0 Authorization Code Flow
- OpenID Connect (OIDC)
- Role-Based Access Control (RBAC)
- Token-based Authentication

### Testing

* Jest
* Supertest

## Architectural Principles

* Microservices-first approach
* Domain-Driven Design (DDD)
* Clean Architecture
* Hexagonal Architecture
* Event-Driven Architecture
* Database per Service
* Eventual Consistency

## Development

CineScope is an **npm workspaces** monorepo. All shared dev tooling
(`typescript`, `@types/node`, `eslint`, `prettier`, `jest`, `tsx`, …) lives in
the root `package.json`; each service only declares its own runtime
dependencies. There is a **single hoisted `node_modules` at the repo root**.

You do **not** need Node.js installed on your host. Everything runs inside
Docker, and the workspace's `node_modules` is bind-mounted back to the host so
your editor (VS Code) resolves every package with no red squiggles.

### Requirements

* Docker + Docker Compose

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

### Production images

Each service ships a multi-stage `Dockerfile`. Because of the single workspace
lockfile, build them from the repository **root**:

```bash
docker build -f auth-service/Dockerfile -t cinescope/auth-service .
```

> Note: when Prisma schemas are added, give each service its own generated
> client `output` path so the hoisted `node_modules` clients don't collide.

## Current Status

The repository currently contains the foundational infrastructure required to support the platform:

* Docker environment
* Container orchestration configuration
* Messaging infrastructure
* Database services
* Cache services

Additional business services will be introduced incrementally.

## Planned Features

* Authentication and authorization
* Movie and TV catalog
* Ratings and reviews
* Favorites and watchlists
* Recommendations
* API Gateway
* Event-driven communication
* Outbox Pattern
* Saga Pattern
* Kubernetes deployment

## License

This project is released under the MIT License.
