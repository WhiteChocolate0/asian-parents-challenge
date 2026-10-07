import type { VercelRequest, VercelResponse } from '@vercel/node'
import { methodNotAllowed, serverError } from './_lib/http.js'
import { getParticipant, getSocialOverview } from './_lib/social.js'

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'GET') return methodNotAllowed(response, ['GET'])
  response.setHeader('Cache-Control', 'private, no-store')
  try {
    const participant = await getParticipant(request)
    if (!participant) return response.status(401).json({ error: 'Participant unavailable' })
    return response.status(200).json(await getSocialOverview(participant))
  } catch (error) {
    return serverError(response, error)
  }
}
