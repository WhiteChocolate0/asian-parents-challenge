import type { VercelRequest, VercelResponse } from '@vercel/node'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ createShareToken: vi.fn(), getSharedResult: vi.fn() }))
vi.mock('../../api/_lib/tokens.js', () => mocks)
import handler from '../../api/share.js'

function responseRecorder() {
  return {
    code: 200, body: undefined as unknown,
    setHeader: vi.fn(),
    status(this: { code: number }, code: number) { this.code = code; return this },
    json(this: { body: unknown }, body: unknown) { this.body = body; return this },
  }
}
async function call(method: string, body?: unknown, query: Record<string, string> = {}) {
  const response = responseRecorder()
  await handler({ method, body, query } as unknown as VercelRequest, response as unknown as VercelResponse)
  return response
}

describe('consolidated share API routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.createShareToken.mockResolvedValue({ status: 'created', token: 'share-token' })
    mocks.getSharedResult.mockResolvedValue({ persona_key: 'money' })
  })

  it('creates a share token using POST', async () => {
    const response = await call('POST', { quiz_result_id: '11111111-1111-4111-8111-111111111111' })
    expect(response.code).toBe(201)
    expect(response.body).toEqual({ share_token: 'share-token', share_url: '/result/share/share-token' })
  })

  it('reads public share results using GET query token', async () => {
    const response = await call('GET', undefined, { token: 'share-token' })
    expect(response.code).toBe(200)
    expect(response.body).toEqual({ result: { persona_key: 'money' } })
    expect(mocks.getSharedResult).toHaveBeenCalledWith('share-token')
  })

  it('returns 400 for invalid bodies and 405 for unsupported methods', async () => {
    expect((await call('POST', { quiz_result_id: 'nope' })).code).toBe(400)
    expect((await call('PATCH')).code).toBe(405)
  })
})
