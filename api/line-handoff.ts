import type { VercelRequest, VercelResponse } from '@vercel/node'
import { badRequest, isUuid, methodNotAllowed, readBody, serverError } from './_lib/http.js'
import { createLineToken } from './_lib/tokens.js'

function normalizedLineOaId(lineOaBasicId: string) {
  const configuredId = lineOaBasicId.trim().replace(/^@/, '')
  return /^[A-Za-z0-9._-]+$/.test(configuredId) ? `@${configuredId}` : null
}

export function buildLineHandoffUrl(rawToken: string, lineOaBasicId: string) {
  const normalizedId = normalizedLineOaId(lineOaBasicId)
  if (!normalizedId) throw new Error('LINE_OA_BASIC_ID is missing or invalid')
  const encodedLineId = encodeURIComponent(normalizedId)
  const encodedMessage = encodeURIComponent(`campaign_token=${rawToken}`)
  return `https://line.me/R/oaMessage/${encodedLineId}/?${encodedMessage}`
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'POST') return methodNotAllowed(response, ['POST'])
  const body = readBody(request)
  if (!body || !isUuid(body.session_id)) return badRequest(response, 'Invalid handoff request')
  const lineOaBasicId = process.env.LINE_OA_BASIC_ID
  if (!lineOaBasicId || !normalizedLineOaId(lineOaBasicId)) return response.status(503).json({ error: 'LINE handoff is not configured' })
  try {
    // Validate configuration before creating a single-use token, so a typo
    // cannot strand a token that the user was never able to open.
    buildLineHandoffUrl('A'.repeat(43), lineOaBasicId)
  } catch {
    return response.status(503).json({ error: 'LINE handoff is not configured' })
  }
  try {
    const handoff = await createLineToken(body.session_id, request)
    if (handoff.status === 'forbidden') return response.status(403).json({ error: 'Quiz result is not owned by this participant' })
    if (handoff.status === 'throttled') return response.status(429).json({ error: 'Please wait before creating another LINE handoff' })
    return response.status(201).json({
      handoffUrl: buildLineHandoffUrl(handoff.token, lineOaBasicId),
      expiresAt: handoff.expiresAt,
    })
  } catch (error) {
    return serverError(response, error)
  }
}
