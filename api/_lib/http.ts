import type { VercelRequest, VercelResponse } from '@vercel/node'

export function methodNotAllowed(response: VercelResponse, allowed: string[]) {
  response.setHeader('Allow', allowed.join(', '))
  return response.status(405).json({ error: 'Method not allowed' })
}

export function badRequest(response: VercelResponse, error = 'Invalid request') {
  return response.status(400).json({ error })
}

export function serverError(response: VercelResponse, error: unknown) {
  const candidate = error as { name?: unknown; message?: unknown; cause?: unknown; code?: unknown; details?: unknown; hint?: unknown; status?: unknown } | null
  const diagnostic = {
    type: typeof error,
    ownKeys: error && typeof error === 'object' ? Object.getOwnPropertyNames(error) : [],
    serialized: error && typeof error === 'object' && 'toJSON' in error && typeof error.toJSON === 'function' ? error.toJSON() : undefined,
    name: candidate?.name,
    message: candidate?.message,
    cause: candidate?.cause,
    code: candidate?.code,
    details: candidate?.details,
    hint: candidate?.hint,
    status: candidate?.status,
  }
  console.error('API request failed', diagnostic)
  return response.status(500).json({ error: 'Unable to process request' })
}

export function readBody(request: VercelRequest): Record<string, unknown> | null {
  if (request.body && typeof request.body === 'object') return request.body as Record<string, unknown>
  if (typeof request.body !== 'string') return null
  try {
    const body = JSON.parse(request.body)
    return body && typeof body === 'object' && !Array.isArray(body) ? body as Record<string, unknown> : null
  } catch {
    return null
  }
}

export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}
