# ADR 0001: Propagate the caller's JWT through the gateway

## Status

Accepted on 2026-10-03. The behaviour it records shipped with `gateway/proxy` and `gateway/auth`; this record closes `gateway/jwt-propagation`.

## Context

auth-service issues the platform's access tokens: JWTs carrying `sub`, `username`, `email`, `roles` and `permissions`, signed with `JWT_ACCESS_SECRET` under the issuer `auth-service`, with no `aud` claim (`apps/auth-service/src/infrastructure/security/jwtAccessTokenGenerator.ts`).

When `auth/authorization` put catalog writes behind the `catalog:write` permission, no gateway existed yet, so catalog-service verified the access token itself with the same secret (`composeWriteGuards` in `apps/catalog-service/src/main/composition.ts`). We recorded that as an interim measure, to be reconsidered once the gateway existed.

The gateway now fronts every service. `gateway/proxy` forwards requests through http-proxy-middleware, which copies the incoming request headers onto the outgoing request and changes only those it is configured to change: `Host` (`changeOrigin`) and the forwarding headers (`xfwd`, after `stripForwardedHeaders` has discarded any the client sent). `gateway/auth` then added `buildOptionalAuth` at the edge: a request without an `Authorization` header passes through as anonymous, a valid token populates `req.auth`, and a header that is present but fails verification is answered with a 401 before any service sees the request.

The open question was how a downstream service learns who is calling.

## Decision

The gateway forwards the caller's original access token, unmodified, in the `Authorization` header. It does not mint an internal token and does not send identity headers.

Every service that protects a route verifies the token itself, with the same secret and the same pinned issuer as the gateway. catalog-service's check is therefore permanent defense in depth, not a stopgap awaiting removal.

`req.auth` at the gateway is gateway-local. It serves the gateway's own decisions and is never forwarded; no service treats anything the gateway concluded about a token as a trust signal.

## Alternatives considered

### A. Forward the original JWT unmodified (chosen)

It costs no code: the proxy already forwards the header, and `apps/gateway-service/tests/auth.test.ts` asserts that a valid token's `Authorization` header reaches the service byte-identical, for a `GET` through the `/catalog` prefix. Each service checks a token it can verify on its own, so no service depends on the gateway having run.

### B. Verify at the gateway and re-sign an internal token

The gateway would exchange the public token for one it signs itself. That would allow a per-service `aud` and decouple the internal token's format and lifetime from the public one. It also needs a second signing key, minting and key rotation in the gateway, and turns the gateway into a token issuer. With one issuer and two verifiers, all built and deployed together, that buys nothing at this scale.

### C. Trusted identity headers

The gateway would verify the token and pass the caller downstream as headers such as `X-User-Id`. Services would then have to trust the gateway blindly: any request that reached a service without crossing the gateway could claim any identity, and in development `docker-compose.yml` publishes every service's port directly. That contradicts the decision that catalog-service verifies for itself. If this option is ever adopted, stripping those headers on ingress becomes mandatory, as `stripForwardedHeaders` already does for `Forwarded` and the `X-Forwarded-*` headers.

## Consequences

### Tokens and keys

- One secret, `JWT_ACCESS_SECRET`, is shared by auth-service, which signs, and by gateway-service and catalog-service, which verify. auth-service never verifies access tokens itself.
- Tokens are HS256. Neither the signer nor the verifiers set an algorithm: HS256 is jsonwebtoken's signing default, and for a string secret the verifiers accept only the HMAC algorithms.
- Both verifiers pin `issuer: 'auth-service'` (`apps/gateway-service/src/index.ts`, `apps/catalog-service/src/main/composition.ts`). No `aud` claim is issued or checked.
- Refresh tokens are signed with a separate secret, `JWT_REFRESH_SECRET`, that only auth-service holds.
- Access tokens last 15 minutes and refresh tokens 30 days, the defaults of `JWT_ACCESS_EXPIRES_IN` and `JWT_REFRESH_EXPIRES_IN` in `apps/auth-service/src/config/env.ts`. Verification checks signature, expiry and issuer only, so an access token cannot be revoked within its window; revocation exists for refresh tokens alone.

### Double verification

- A request to a guarded catalog route is verified twice: by the gateway, then by catalog-service. Each check is one HMAC over a short token, so the cost is negligible.
- A token that expires between the two checks passes the gateway and gets a 401 from the service. We accept that: the window is the time the request spends in transit, and the client recovers as from any expired token.

### Public routes

- Because the gateway rejects any token that is present but unusable, an invalid token on a public route such as `GET /catalog/movies` gets a 401 from the gateway, while the same call made directly to catalog-service succeeds, since catalog does not guard its reads. This is deliberate: the edge never downgrades a broken token to an anonymous caller.

### Accepted risk: cross-service replay

All verifiers share the secret and the issuer, and no audience is set, so a token is valid at every service that verifies tokens. A service that receives a user's token could replay it against another service for the rest of its lifetime. The gateway forwards the header to all five services; today review-service, watchlist-service and recommendation-service receive it without using it. We accept this while every service is built and deployed together. Per-service audiences are the remedy if that changes.

### Operations

- The secret must be identical in auth-service, catalog-service and gateway-service. `docker-compose.yml` does not set it: each service imports `dotenv/config` first, which reads `.env` from the process's working directory, and compose runs each service in `/workspace/apps/<service>` over the bind-mounted repository. Each service therefore reads its own `apps/<service>/.env`. The `.env.example` files of catalog-service and gateway-service state that the value must be byte-identical to auth-service's.
- Rotating the secret means changing all three files and restarting all three services. Tokens signed with the old secret fail verification from that point on.

### Rule for gateway/composition

Propagation is free only while the gateway proxies. Composition endpoints make outbound calls of their own, and those carry no caller headers unless the gateway sets them. Every such call must copy the caller's `Authorization` header explicitly, and `gateway/composition` must include a test proving that it does.

## Revisit when

- Service-to-service calls appear: a service calling another with no end user behind the request, where there is no caller's token to forward.
- Phase 6 (OAuth 2.0 / OpenID Connect) moves signing to asymmetric keys published through JWKS. Verifiers would then hold only public keys, which removes the shared signing secret.
- `infra/k8s` moves the secret into a single Kubernetes Secret, which changes how the three services are kept in sync.
