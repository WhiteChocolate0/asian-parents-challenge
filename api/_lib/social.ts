import { createHash, randomBytes } from 'node:crypto'
import type { VercelRequest } from '@vercel/node'
import { isUuid } from './http.js'
import { getSupabaseAdmin } from './supabase-admin.js'
import { compareRankedCandidates } from '../../shared/ranking.js'

const admin = () => getSupabaseAdmin().schema('campaign')
const tokenHash = (token: string) => createHash('sha256').update(token).digest('hex')
const randomToken = () => randomBytes(32).toString('base64url')

export type Participant = {
  id: string
  nickname: string
  source_referral_link_id: string | null
  public_leaderboard_opt_in: boolean
}

export async function getParticipant(request: VercelRequest): Promise<Participant | null> {
  const id = request.headers['x-participant-id']
  const token = request.headers['x-participant-token']
  if (typeof id !== 'string' || !isUuid(id) || typeof token !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(token)) return null
  const { data, error } = await admin().from('participants')
    .select('id, nickname, source_referral_link_id, public_leaderboard_opt_in')
    .eq('id', id).eq('anonymous_token_hash', tokenHash(token)).maybeSingle()
  if (error) throw error
  return data as Participant | null
}

export async function createParticipant(nickname: string, referralToken?: string) {
  let sourceLinkId: string | null = null
  if (referralToken && /^[A-Za-z0-9_-]{12,64}$/.test(referralToken)) {
    const { data: link, error } = await admin().from('referral_links').select('id').eq('token', referralToken).maybeSingle()
    if (error) throw error
    sourceLinkId = link?.id ?? null
  }
  const token = randomToken()
  const { data, error } = await admin().from('participants')
    .insert({ nickname, anonymous_token_hash: tokenHash(token), source_referral_link_id: sourceLinkId })
    .select('id, nickname, public_leaderboard_opt_in').single()
  if (error) throw error
  await getReferralLink(data.id)
  return { participant_id: data.id as string, nickname: data.nickname as string, participant_token: token, public_leaderboard_opt_in: false }
}

export async function getReferralLink(participantId: string) {
  const { data: existing, error: readError } = await admin().from('referral_links')
    .select('id, token').eq('owner_participant_id', participantId).maybeSingle()
  if (readError) throw readError
  if (existing) return existing as { id: string; token: string }
  const { data, error } = await admin().from('referral_links')
    .insert({ owner_participant_id: participantId, token: randomBytes(18).toString('base64url') })
    .select('id, token').single()
  if (error?.code === '23505') return getReferralLink(participantId)
  if (error) throw error
  return data as { id: string; token: string }
}

export async function resolveReferralLink(token: unknown, participantId: string): Promise<string | null> {
  if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{12,64}$/.test(token)) return null
  const { data, error } = await admin().from('referral_links').select('id, owner_participant_id').eq('token', token).maybeSingle()
  if (error) throw error
  return data && data.owner_participant_id !== participantId ? data.id as string : null
}

export async function attachFirstReferral(participant: Participant, linkId: string | null) {
  if (!linkId || participant.source_referral_link_id) return
  const { error } = await admin().from('participants')
    .update({ source_referral_link_id: linkId }).eq('id', participant.id).is('source_referral_link_id', null)
  if (error) throw error
}

export async function openReferral(token: string) {
  if (!/^[A-Za-z0-9_-]{12,64}$/.test(token)) return null
  const { data, error } = await admin().from('referral_links')
    .select('id, participants!referral_links_owner_participant_id_fkey(nickname)').eq('token', token).maybeSingle()
  if (error) throw error
  if (!data) return null
  const owner = data.participants as unknown as { nickname: string }
  const { error: eventError } = await admin().from('referral_events').insert({ referral_link_id: data.id, event_type: 'OPENED' })
  if (eventError) throw eventError
  return { inviter_nickname: owner.nickname }
}

export async function recordReferralEvent(linkId: string | null, participantId: string, sessionId: string, eventType: 'STARTED' | 'COMPLETED') {
  if (!linkId) return
  const { error } = await admin().from('referral_events').insert({
    referral_link_id: linkId, visitor_participant_id: participantId,
    quiz_session_id: sessionId, event_type: eventType,
  })
  if (error && error.code !== '23505') throw error
}

export async function authorizeSession(request: VercelRequest, sessionId: string) {
  const { data, error } = await admin().from('quiz_sessions').select('participant_id').eq('id', sessionId).maybeSingle()
  if (error) throw error
  if (!data) return false
  if (!data.participant_id) return true // Attempts created before participant registration.
  const participant = await getParticipant(request)
  return participant?.id === data.participant_id
}

type BoardRow = {
  participant_id: string
  nickname: string
  defense_value: number
  persona_key: string
  completed_at: string
  source_referral_link_id: string | null
  public_leaderboard_opt_in: boolean
}
export async function getSocialOverview(participant: Participant) {
  const link = await getReferralLink(participant.id)
  const { data: circleData, error: circleError } = await admin().from('latest_participant_results')
    .select('participant_id, nickname, defense_value, persona_key, completed_at, source_referral_link_id, public_leaderboard_opt_in')
    .or(`participant_id.eq.${participant.id},source_referral_link_id.eq.${link.id}`)
  if (circleError) throw circleError
  const circle = ((circleData ?? []) as BoardRow[]).sort(compareRankedCandidates)
  const unlocked = circle.some((row) => row.participant_id !== participant.id)
  let global: BoardRow[] = []
  if (unlocked) {
    const { data, error } = await admin().from('latest_participant_results')
      .select('participant_id, nickname, defense_value, persona_key, completed_at, source_referral_link_id, public_leaderboard_opt_in')
      .eq('public_leaderboard_opt_in', true).order('defense_value', { ascending: false }).order('completed_at', { ascending: true }).order('participant_id', { ascending: true }).limit(100)
    if (error) throw error
    global = ((data ?? []) as BoardRow[]).sort(compareRankedCandidates)
  }
  const { data: events, error: eventsError } = await admin().from('referral_events')
    .select('visitor_participant_id, quiz_session_id, created_at').eq('referral_link_id', link.id)
    .eq('event_type', 'COMPLETED').order('created_at', { ascending: false }).limit(5)
  if (eventsError) throw eventsError
  const visitorIds = [...new Set((events ?? []).map((event) => event.visitor_participant_id).filter((id): id is string => Boolean(id)))]
  const sessionIds = [...new Set((events ?? []).map((event) => event.quiz_session_id).filter((id): id is string => Boolean(id)))]
  const [{ data: visitors, error: visitorsError }, { data: eventResults, error: resultsError }] = await Promise.all([
    visitorIds.length ? admin().from('participants').select('id, nickname').in('id', visitorIds) : Promise.resolve({ data: [], error: null }),
    sessionIds.length ? admin().from('quiz_results').select('quiz_session_id, defense_value').in('quiz_session_id', sessionIds) : Promise.resolve({ data: [], error: null }),
  ])
  if (visitorsError) throw visitorsError
  if (resultsError) throw resultsError
  const activity = (events ?? []).map((event) => ({
    nickname: visitors?.find((row) => row.id === event.visitor_participant_id)?.nickname ?? '挑戰者',
    defense_score: eventResults?.find((row) => row.quiz_session_id === event.quiz_session_id)?.defense_value ?? null,
    completed_at: event.created_at,
  }))
  const ownRank = circle.findIndex((row) => row.participant_id === participant.id) + 1
  const ownScore = circle.find((row) => row.participant_id === participant.id)?.defense_value
  const percentile = ownScore === undefined ? null : Math.round(circle.filter((row) => row.defense_value < ownScore).length / circle.length * 100)
  const distribution = circle.reduce<Record<string, number>>((acc, row) => { acc[row.persona_key] = (acc[row.persona_key] ?? 0) + 1; return acc }, {})
  const commonPersona = Object.entries(distribution).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] ?? null
  const compact = (row: BoardRow, index: number) => ({ rank: index + 1, nickname: row.nickname, defense_score: row.defense_value, persona: row.persona_key, is_you: row.participant_id === participant.id })
  return {
    referral_token: link.token, unlocked, completed_referrals: circle.filter((row) => row.participant_id !== participant.id).length,
    circle: unlocked ? circle.map(compact) : [], global: unlocked ? global.map(compact) : [], activity,
    insights: unlocked ? { rank: ownRank || null, percentile, common_persona: commonPersona } : null,
    public_leaderboard_opt_in: participant.public_leaderboard_opt_in,
  }
}
