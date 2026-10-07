import type { VercelRequest, VercelResponse } from '@vercel/node'
import { badRequest, isUuid, methodNotAllowed, readBody, serverError } from '../_lib/http.js'
import { calculateAndStoreResult, createQuizSession, getQuizSession, isOptionKey, saveQuizAnswer } from '../_lib/quiz.js'
import { attachFirstReferral, authorizeSession, getParticipant, resolveReferralLink } from '../_lib/social.js'

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const action = request.query.action
  if (typeof action !== 'string') return response.status(404).json({ error: 'Unknown quiz action' })

  if (action === 'start') {
    if (request.method !== 'POST') return methodNotAllowed(response, ['POST'])
    const body = readBody(request)
    if (!body || (body.quiz_version !== undefined && body.quiz_version !== 'v1')) return badRequest(response, 'Invalid quiz version')
    try {
      const participant = await getParticipant(request)
      if (!participant) return response.status(401).json({ error: 'Participant registration required' })
      const referralLinkId = await resolveReferralLink(body.referral_token, participant.id)
      await attachFirstReferral(participant, referralLinkId)
      const sessionId = await createQuizSession(participant, referralLinkId ?? participant.source_referral_link_id)
      return response.status(201).json({ session_id: sessionId, quiz_version: 'v1' })
    } catch (error) {
      return serverError(response, error)
    }
  }

  if (action === 'answer') {
    if (request.method !== 'POST') return methodNotAllowed(response, ['POST'])
    const body = readBody(request)
    if (!body || !isUuid(body.session_id) || typeof body.question_id !== 'string' || !/^q\d{2}$/.test(body.question_id) || !isOptionKey(body.option_id)) return badRequest(response, 'Invalid answer payload')
    try {
      if (!await authorizeSession(request, body.session_id)) return response.status(403).json({ error: 'Quiz session unavailable' })
      const saved = await saveQuizAnswer(body.session_id, body.question_id, body.option_id)
      if (saved.status === 'invalid_session') return response.status(404).json({ error: 'Quiz session not found' })
      if (saved.status === 'invalid_option') return badRequest(response, 'Unknown question or option')
      return response.status(200).json({ status: 'saved' })
    } catch (error) {
      return serverError(response, error)
    }
  }

  if (action === 'session') {
    if (request.method !== 'GET') return methodNotAllowed(response, ['GET'])
    const sessionId = request.query.session_id
    if (typeof sessionId !== 'string' || !isUuid(sessionId)) return badRequest(response, 'Invalid session request')
    try {
      if (!await authorizeSession(request, sessionId)) return response.status(403).json({ error: 'Quiz session unavailable' })
      const session = await getQuizSession(sessionId)
      if (!session) return response.status(404).json({ error: 'Quiz session not found' })
      return response.status(200).json(session)
    } catch (error) {
      return serverError(response, error)
    }
  }

  if (action === 'result' || action === 'complete') {
    if (request.method !== 'POST') return methodNotAllowed(response, ['POST'])
    const body = readBody(request)
    if (!body || !isUuid(body.session_id)) return badRequest(response, 'Invalid result request')
    try {
      if (!await authorizeSession(request, body.session_id)) return response.status(403).json({ error: 'Quiz session unavailable' })
      const calculated = await calculateAndStoreResult(body.session_id)
      if (calculated.status === 'invalid_session') return response.status(404).json({ error: 'Quiz session not found' })
      if (calculated.status === 'incomplete') return response.status(409).json({ error: 'Quiz is incomplete', answered: calculated.answered, required: calculated.required })
      return response.status(200).json({ result: calculated.result })
    } catch (error) {
      return serverError(response, error)
    }
  }

  return response.status(404).json({ error: 'Unknown quiz action' })
}
