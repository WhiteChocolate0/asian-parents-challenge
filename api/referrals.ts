import type { VercelRequest, VercelResponse } from '@vercel/node'
import { badRequest, methodNotAllowed, readBody, serverError } from './_lib/http.js'
import { getParticipant, getReferralLink, openReferral } from './_lib/social.js'

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const action = request.query.action
  if (action === 'open') {
    if (request.method !== 'POST') return methodNotAllowed(response, ['POST'])
    const token = readBody(request)?.referral_token
    if (typeof token !== 'string') return badRequest(response)
    try {
      const referral = await openReferral(token)
      if (!referral) return response.status(404).json({ error: 'Challenge link unavailable' })
      return response.status(200).json(referral)
    } catch (error) {
      return serverError(response, error)
    }
  }
  if (action === 'link') {
    if (request.method !== 'GET') return methodNotAllowed(response, ['GET'])
    response.setHeader('Cache-Control', 'private, no-store')
    try {
      const participant = await getParticipant(request)
      if (!participant) return response.status(401).json({ error: 'Participant unavailable' })
      const link = await getReferralLink(participant.id)
      return response.status(200).json({ referral_token: link.token, share_url: `/?ref=${link.token}` })
    } catch (error) {
      return serverError(response, error)
    }
  }
  return response.status(404).json({ error: 'Unknown referral action' })
}
