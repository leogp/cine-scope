import { buildErrorHandler } from '@cinescope/shared/infrastructure/http'

// The gateway owns no domain errors: proxy transport failures are answered in
// the proxy's own `on.error` hook and never reach Express' error chain. Anything
// arriving here is a gateway bug, so it takes the shared 500 fallback.
export const errorHandler = buildErrorHandler(() => undefined)
