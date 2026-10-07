import type { VercelRequest, VercelResponse } from '@vercel/node'
import { badRequest, methodNotAllowed, readBody, serverError } from './_lib/http.js'
import { createParticipant, getParticipant } from './_lib/social.js'
import { getSupabaseAdmin } from './_lib/supabase-admin.js'
import { normalizeNickname } from '../shared/nickname.js'

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const action = request.query.action
  if (action !== undefined && action !== 'me') return response.status(404).json({ error: 'Unknown participant action' })
  if (action === 'me') {
    if (request.method !== 'GET' && request.method !== 'PATCH') return methodNotAllowed(response, ['GET', 'PATCH'])
    response.setHeader('Cache-Control', 'private, no-store')
    try {
      const participant = await getParticipant(request)
      if (!participant) return response.status(401).json({ error: 'Participant unavailable' })
      if (request.method === 'GET') return response.status(200).json({ participant_id: participant.id, nickname: participant.nickname, public_leaderboard_opt_in: participant.public_leaderboard_opt_in })
      const body = readBody(request)
      if (typeof body?.public_leaderboard_opt_in !== 'boolean') return badRequest(response)
      const { error } = await getSupabaseAdmin().schema('campaign').from('participants')
        .update({ public_leaderboard_opt_in: body.public_leaderboard_opt_in }).eq('id', participant.id)
      if (error) throw error
      return response.status(200).json({ public_leaderboard_opt_in: body.public_leaderboard_opt_in })
    } catch (error) {
      return serverError(response, error)
    }
  }
  if (request.method !== 'POST') return methodNotAllowed(response, ['POST'])
  const body = readBody(request)
  const nickname = normalizeNickname(body?.nickname)
  if (!nickname) return badRequest(response, '暱稱需為 2～12 字，且不能包含不適合的文字。')
  if (body?.referral_token !== undefined && (typeof body.referral_token !== 'string' || body.referral_token.length > 64)) return badRequest(response)
  try {
    const participant = await createParticipant(nickname, body?.referral_token as string | undefined)
    return response.status(201).json(participant)
  } catch (error) {
    return serverError(response, error)
  }
}
