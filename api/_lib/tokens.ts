import { createHash, randomBytes } from 'node:crypto'
import type { VercelRequest } from '@vercel/node'
import { getSupabaseAdmin } from './supabase-admin.js'
import { ownedCompletedResultForSession } from './line-handoff-ownership.js'

function newToken() {
  return randomBytes(32).toString('base64url')
}

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

async function ensureResultExists(quizResultId: string) {
  const admin = getSupabaseAdmin()
  const { data, error } = await admin.schema('campaign').from('quiz_results').select('id').eq('id', quizResultId).maybeSingle()
  if (error) throw error
  return Boolean(data)
}

async function recentlyCreated(table: 'share_results' | 'link_tokens', quizResultId: string) {
  const since = new Date(Date.now() - 60_000).toISOString()
  const { data, error } = await getSupabaseAdmin().schema('campaign').from(table)
    .select('id').eq('quiz_result_id', quizResultId).gt('created_at', since).limit(1)
  if (error) throw error
  return Boolean(data?.length)
}

export async function createShareToken(quizResultId: string) {
  if (!await ensureResultExists(quizResultId)) return { status: 'missing' as const }
  if (await recentlyCreated('share_results', quizResultId)) return { status: 'throttled' as const }
  const token = newToken()
  const { error } = await getSupabaseAdmin().schema('campaign').from('share_results').insert({
    quiz_result_id: quizResultId,
    share_token_hash: hashToken(token),
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  })
  if (error) throw error
  return { status: 'created' as const, token }
}

export async function getSharedResult(token: string) {
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return null
  const { data, error } = await getSupabaseAdmin().schema('campaign').from('share_results')
    .select('expires_at, quiz_results!inner(persona_key, defense_value, ability_scores_json, result_summary)')
    .eq('share_token_hash', hashToken(token))
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  const row = data as unknown as {
    quiz_results: {
      persona_key: string
      defense_value: number
      ability_scores_json: Record<string, number>
      result_summary: Record<string, unknown>
    }
  }
  return row.quiz_results
}

export const LINE_HANDOFF_TTL_MS = 15 * 60 * 1000

export async function createLineToken(sessionId: string, request: VercelRequest) {
  const quizResultId = await ownedCompletedResultForSession(request, sessionId)
  if (!quizResultId) return { status: 'forbidden' as const }
  if (await recentlyCreated('link_tokens', quizResultId)) return { status: 'throttled' as const }
  const token = newToken()
  const expiresAt = new Date(Date.now() + LINE_HANDOFF_TTL_MS).toISOString()
  const { error } = await getSupabaseAdmin().schema('campaign').from('link_tokens').insert({
    quiz_result_id: quizResultId,
    token_hash: hashToken(token),
    expires_at: expiresAt,
  })
  if (error) throw error
  return { status: 'created' as const, token, expiresAt }
}
