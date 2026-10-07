import type { VercelRequest, VercelResponse } from '@vercel/node'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ createLineToken: vi.fn() }))
vi.mock('../../api/_lib/tokens.js', () => ({ createLineToken: mocks.createLineToken }))

import handler, { buildLineHandoffUrl } from '../../api/line-handoff.js'

function responseRecorder() {
  return {
    code: 200,
    body: undefined as unknown,
    setHeader: vi.fn(),
    status(this: { code: number }, code: number) { this.code = code; return this },
    json(this: { body: unknown }, body: unknown) { this.body = body; return this },
  }
}

describe('LINE handoff endpoint', () => {
  beforeEach(() => {
    mocks.createLineToken.mockReset().mockResolvedValue({
      status: 'created', token: 'A'.repeat(43), expiresAt: '2026-10-06T12:15:00.000Z',
    })
    vi.stubEnv('LINE_OA_BASIC_ID', '@toyota_ev_bot')
  })

  it('HANDOFF_CREATE_003 returns a LINE OA URL with campaign_token and expiry, not a token field', async () => {
    const response = responseRecorder()
    const request = { method: 'POST', body: { session_id: '11111111-1111-4111-8111-111111111111' }, headers: {} } as VercelRequest
    await handler(request, response as unknown as VercelResponse)
    expect(response.code).toBe(201)
    const body = response.body as { handoffUrl: string; expiresAt: string }
    expect(body.handoffUrl).toMatch(/^https:\/\/line\.me\/R\/oaMessage\/%40toyota_ev_bot\//)
    expect(decodeURIComponent(body.handoffUrl.split('/?')[1])).toBe(`campaign_token=${'A'.repeat(43)}`)
    expect(body.expiresAt).toBe('2026-10-06T12:15:00.000Z')
    expect(body).not.toHaveProperty('token')
    expect(mocks.createLineToken).toHaveBeenCalledWith('11111111-1111-4111-8111-111111111111', request)
  })

  it('HANDOFF_CREATE_002 does not accept a client-supplied result primary key as ownership', async () => {
    const response = responseRecorder()
    await handler({ method: 'POST', body: { quiz_result_id: '11111111-1111-4111-8111-111111111111' }, headers: {} } as VercelRequest, response as unknown as VercelResponse)
    expect(response.code).toBe(400)
    expect(mocks.createLineToken).not.toHaveBeenCalled()
  })

  it('rejects unsupported methods without attempting token creation', async () => {
    const response = responseRecorder()
    await handler({ method: 'GET', query: {}, headers: {} } as VercelRequest, response as unknown as VercelResponse)
    expect(response.code).toBe(405)
    expect(mocks.createLineToken).not.toHaveBeenCalled()
  })

  it('denies a session that is not owned without returning a link', async () => {
    mocks.createLineToken.mockResolvedValueOnce({ status: 'forbidden' })
    const response = responseRecorder()
    await handler({ method: 'POST', body: { session_id: '11111111-1111-4111-8111-111111111111' }, headers: {} } as VercelRequest, response as unknown as VercelResponse)
    expect(response.code).toBe(403)
    expect(response.body).toEqual({ error: 'Quiz result is not owned by this participant' })
  })

  it('does not create a DB token when the LINE OA Basic ID is not configured', async () => {
    vi.stubEnv('LINE_OA_BASIC_ID', '')
    const response = responseRecorder()
    await handler({ method: 'POST', body: { session_id: '11111111-1111-4111-8111-111111111111' }, headers: {} } as VercelRequest, response as unknown as VercelResponse)
    expect(response.code).toBe(503)
    expect(mocks.createLineToken).not.toHaveBeenCalled()
  })

  it('does not create an orphan DB token for an invalid LINE OA Basic ID', async () => {
    vi.stubEnv('LINE_OA_BASIC_ID', 'https://line.me/@invalid')
    const response = responseRecorder()
    await handler({ method: 'POST', body: { session_id: '11111111-1111-4111-8111-111111111111' }, headers: {} } as VercelRequest, response as unknown as VercelResponse)
    expect(response.code).toBe(503)
    expect(mocks.createLineToken).not.toHaveBeenCalled()
  })

  it('does not create a DB token when the LINE OA Basic ID is invalid', async () => {
    vi.stubEnv('LINE_OA_BASIC_ID', 'https://line.me/@not-an-id')
    const response = responseRecorder()
    await handler({ method: 'POST', body: { session_id: '11111111-1111-4111-8111-111111111111' }, headers: {} } as VercelRequest, response as unknown as VercelResponse)
    expect(response.code).toBe(503)
    expect(mocks.createLineToken).not.toHaveBeenCalled()
  })
})

describe('LINE OA URL builder', () => {
  it('uses the official oaMessage URL scheme and UTF-8 percent-encoded message text', () => {
    const url = buildLineHandoffUrl('raw-token', 'toyota_ev_bot')
    expect(url).toBe(`https://line.me/R/oaMessage/%40toyota_ev_bot/?${encodeURIComponent('campaign_token=raw-token')}`)
    expect(url).not.toContain('token_hash')
    expect(url).not.toContain('quiz_result_id')
  })
})
