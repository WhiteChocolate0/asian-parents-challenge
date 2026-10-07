import { createClient } from '@supabase/supabase-js'

function requireServerEnv(name: 'SUPABASE_URL' | 'SUPABASE_SERVICE_ROLE_KEY') {
  const value = process.env[name]
  if (!value) {
    console.error(`Missing required server environment variable: ${name}`)
    throw new Error(`Missing server environment variable: ${name}`)
  }
  return value
}

/** Server-only. Do not import this module from src/. */
export function getSupabaseAdmin() {
  return createClient(
    requireServerEnv('SUPABASE_URL'),
    requireServerEnv('SUPABASE_SERVICE_ROLE_KEY'),
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

export function validateServerEnv() {
  requireServerEnv('SUPABASE_URL')
  requireServerEnv('SUPABASE_SERVICE_ROLE_KEY')
}
