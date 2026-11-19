import { readFixtures, type RateLimitHeaders } from '../support/fixtures'

const { credentialCalls } = readFixtures()

interface TierState {
  readonly limit: number
  readonly windowSeconds: number
  readonly remaining: number
}

/**
 * The `credentials` entries of an IETF draft-8 header pair, which carries one
 * entry per tier:
 *   RateLimit-Policy: "global"; q=300; w=60; pk=:…:, "credentials"; q=10; w=900; pk=:…:
 *   RateLimit:        "global"; r=299; t=60, "credentials"; r=9; t=900
 */
function credentialsTier(headers: RateLimitHeaders): TierState {
  const policy = tierParameters(headers.rateLimitPolicy, 'credentials')
  const state = tierParameters(headers.rateLimit, 'credentials')
  return { limit: policy.q, windowSeconds: policy.w, remaining: state.r }
}

function tierParameters(header: string | null, tier: string): Record<string, number> {
  const entry = header?.split(/,\s*(?=")/).find((part) => part.startsWith(`"${tier}"`))
  if (entry === undefined) throw new Error(`No "${tier}" entry in ${JSON.stringify(header)}`)

  const parameters: Record<string, number> = {}
  for (const parameter of entry.split(';').slice(1)) {
    const [name, value] = parameter.trim().split('=')
    parameters[name] = Number(value)
  }
  return parameters
}

describe('credentials tier', () => {
  // Read from the setup's own login and signup: a fresh call would spend the
  // budget this suite is careful with. An entry here means the gateway's
  // credential routes matched the paths auth-service really serves.
  //
  // The limit is taken from the headers, never assumed (a local .env may raise
  // RATE_LIMIT_CREDENTIALS_MAX). The remaining count is only bounded, never
  // compared to an exact value: it depends on earlier runs within the window.
  it.each(['login', 'signup'] as const)("applies to auth-service's real %s route", (call) => {
    const tier = credentialsTier(credentialCalls[call])

    expect(tier.limit).toBeGreaterThan(0)
    expect(tier.windowSeconds).toBeGreaterThan(0)
    // This call was counted against that limit (and succeeded, so not past it).
    expect(tier.remaining).toBeGreaterThanOrEqual(0)
    expect(tier.remaining).toBeLessThan(tier.limit)
  })
})
