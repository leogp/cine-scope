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
