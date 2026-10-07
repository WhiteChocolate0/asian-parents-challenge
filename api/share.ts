import type { VercelRequest, VercelResponse } from '@vercel/node'
import { badRequest, isUuid, methodNotAllowed, readBody, serverError } from './_lib/http.js'
import { createShareToken, getSharedResult } from './_lib/tokens.js'

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method === 'GET') {
    const token = request.query.token
    if (typeof token !== 'string') return response.status(404).json({ error: 'Shared result not found' })
    try {
      const result = await getSharedResult(token)
      if (!result) return response.status(404).json({ error: 'Shared result not found' })
      return response.status(200).json({ result })
    } catch (error) {
      return serverError(response, error)
    }
  }
  if (request.method !== 'POST') return methodNotAllowed(response, ['GET', 'POST'])
  const body = readBody(request)
  if (!body || !isUuid(body.quiz_result_id)) return badRequest(response, 'Invalid share request')
  try {
    const share = await createShareToken(body.quiz_result_id)
    if (share.status === 'missing') return response.status(404).json({ error: 'Quiz result not found' })
    if (share.status === 'throttled') return response.status(429).json({ error: 'Please wait before creating another share link' })
    return response.status(201).json({ share_token: share.token, share_url: `/result/share/${share.token}` })
  } catch (error) {
    return serverError(response, error)
  }
}
