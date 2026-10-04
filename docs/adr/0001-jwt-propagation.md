# ADR 0001: Propagate the caller's JWT through the gateway

## Context

The gateway now fronts every service and forwards requests through http-proxy-middleware, which copies incoming request headers onto outgoing ones. `gateway/auth` added `buildOptionalAuth` at the edge: a request without an `Authorization` header passes through as anonymous, a valid token populates `req.auth`, and a header that is present but fails verification is answered with a 401 before any service sees the request.

The question is how a downstream service learns who is calling.

## Decision

The gateway forwards the caller's original access token, unmodified, in the `Authorization` header. It does not mint an internal token and does not send identity headers.

Every service that protects a route verifies the token itself, with the same secret and the same pinned issuer as the gateway. The token verification is permanent defense in depth, not a stopgap measure.

`req.auth` at the gateway is gateway-local. It serves the gateway's own decisions and is never forwarded; no service treats anything the gateway concluded about a token as a trust signal.

## Alternatives considered

### A. Forward the original JWT unmodified (chosen)

It costs no code: the proxy already forwards the header. Each service checks a token it can verify on its own, so no service depends on the gateway having run.

### B. Verify at the gateway and re-sign an internal token

The gateway would exchange the public token for one it signs itself, allowing per-service `aud` and decoupling internal and public token formats. It requires a second signing key, minting and key rotation in the gateway, and turns the gateway into a token issuer. With one issuer and two verifiers all built and deployed together, that buys nothing at this scale.

### C. Trusted identity headers

The gateway would pass the caller downstream as headers such as `X-User-Id`, forcing services to trust the gateway blindly. Any request reaching a service without crossing the gateway could claim any identity. In development, `docker-compose.yml` publishes every service's port directly, creating a bypass. That contradicts the principle that catalog-service verifies for itself.

## Consequences

- One secret, `JWT_ACCESS_SECRET`, is shared: auth-service signs, gateway-service and catalog-service verify. auth-service never verifies access tokens itself.
- Tokens are HS256 (jsonwebtoken's default). Both verifiers pin `issuer: 'auth-service'` with no `aud` claim.
- Refresh tokens use a separate secret, `JWT_REFRESH_SECRET`, that only auth-service holds.
- Access tokens last 15 minutes and refresh tokens 30 days. Verification checks signature, expiry and issuer only; access tokens cannot be revoked within their window.
- Guarded routes are verified twice: by the gateway, then by the service. Each check is one HMAC over a short token, negligible cost. A token that expires between the two checks gets a 401 from the service, which is acceptable.
- Invalid tokens on public routes get a 401 from the gateway; the same call to catalog-service directly succeeds, since catalog does not guard reads. This is deliberate: the edge never downgrades a broken token to anonymous.
- All verifiers share the secret and issuer with no audience set, so a token is valid at every service that verifies tokens. A service could replay a user's token against another service for its lifetime. This is accepted while every service is built and deployed together; per-service audiences are the remedy if that changes.
- The secret must be identical in auth-service, catalog-service and gateway-service. Each service reads its own `apps/<service>/.env` via `dotenv/config`, sourced from its compose working directory over the bind-mounted repository. Rotating the secret requires changing all three files and restarting all three services.
- Propagation is free only while the gateway proxies. Composition endpoints making outbound calls must copy the caller's `Authorization` header explicitly, and `gateway/composition` must test that they do.
