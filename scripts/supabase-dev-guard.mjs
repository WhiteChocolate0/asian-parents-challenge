export const PRODUCTION_SUPABASE_PROJECT_REF = 'extkwpghjfttamontqkl'

function projectRefFromUrl(value) {
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' || !url.hostname.endsWith('.supabase.co')) return null
    return url.hostname.slice(0, -'.supabase.co'.length)
  } catch {
    return null
  }
}

export function assertSupabaseDevEnvironment(env = process.env) {
  const url = env.SUPABASE_URL ?? ''
  const configuredRef = env.SUPABASE_PROJECT_REF ?? ''
  const actualRef = projectRefFromUrl(url)
  const knownProductionRef = configuredRef === PRODUCTION_SUPABASE_PROJECT_REF || actualRef === PRODUCTION_SUPABASE_PROJECT_REF
  const hackathonOverride = env.ALLOW_HACKATHON_E2E === 'true' && knownProductionRef

  if (knownProductionRef && !hackathonOverride) {
    throw new Error('PRODUCTION_GUARD_TRIGGERED: database test operation refused for the known Production project ref without explicit hackathon opt-in.')
  }
  if (knownProductionRef && env.SUPABASE_ENV !== 'hackathon_integration') {
    throw new Error('SUPABASE_ENV must be "hackathon_integration" for the explicitly allowed pre-release project.')
  }
  if (!knownProductionRef && env.SUPABASE_ENV !== 'development') {
    throw new Error('SUPABASE_ENV must be exactly "development" for a non-Production database test.')
  }
  if (!actualRef || !configuredRef || configuredRef !== actualRef) {
    throw new Error('SUPABASE_PROJECT_REF must be set and match the project ref in SUPABASE_URL.')
  }
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for the DEV database test.')
  }

  return { url, key: env.SUPABASE_SERVICE_ROLE_KEY, projectRef: actualRef, environment: knownProductionRef ? 'hackathon_integration' : 'development' }
}
