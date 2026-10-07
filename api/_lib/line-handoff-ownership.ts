import type { VercelRequest } from '@vercel/node'
import { getSupabaseAdmin } from './supabase-admin.js'
import { getParticipant } from './social.js'

/** Resolve a completed result only through a verified participant-owned session. */
export async function ownedCompletedResultForSession(request: VercelRequest, sessionId: string): Promise<string | null> {
  const participant = await getParticipant(request)
  if (!participant) return null

  const campaign = getSupabaseAdmin().schema('campaign')
  const { data: session, error: sessionError } = await campaign.from('quiz_sessions')
    .select('participant_id, status').eq('id', sessionId).maybeSingle()
  if (sessionError) throw sessionError
  if (session?.status !== 'completed' || session.participant_id !== participant.id) return null

  const { data: result, error: resultError } = await campaign.from('quiz_results')
    .select('id, participant_id').eq('quiz_session_id', sessionId).maybeSingle()
  if (resultError) throw resultError
  if (!result?.id || result.participant_id !== participant.id) return null
  return result.id as string
}
