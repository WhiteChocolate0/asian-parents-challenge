import type { VercelRequest, VercelResponse } from '@vercel/node'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  createQuizSession: vi.fn(), getQuizSession: vi.fn(), saveQuizAnswer: vi.fn(), calculateAndStoreResult: vi.fn(),
  attachFirstReferral: vi.fn(), authorizeSession: vi.fn(), getParticipant: vi.fn(), resolveReferralLink: vi.fn(),
}))
vi.mock('../../api/_lib/quiz.js', () => ({
  createQuizSession: mocks.createQuizSession, getQuizSession: mocks.getQuizSession,
  saveQuizAnswer: mocks.saveQuizAnswer, calculateAndStoreResult: mocks.calculateAndStoreResult,
  isOptionKey: (value: unknown) => ['A', 'B', 'C'].includes(String(value)),
}))
vi.mock('../../api/_lib/social.js', () => ({
  attachFirstReferral: mocks.attachFirstReferral, authorizeSession: mocks.authorizeSession,
  getParticipant: mocks.getParticipant, resolveReferralLink: mocks.resolveReferralLink,
}))

import handler from '../../api/quiz/[action].js'

const sessionId = '11111111-1111-4111-8111-111111111111'
function responseRecorder() {
  return {
    code: 200, body: undefined as unknown, headers: new Map<string, string>(),
    setHeader(name: string, value: string) { this.headers.set(name, value) },
    status(this: { code: number }, code: number) { this.code = code; return this },
    json(this: { body: unknown }, body: unknown) { this.body = body; return this },
  }
}
function request(action: string, method: string, body?: unknown, query: Record<string, string> = {}) {
  return { method, body, query: { action, ...query }, headers: { 'x-participant-id': sessionId } } as unknown as VercelRequest
}
async function call(action: string, method: string, body?: unknown, query: Record<string, string> = {}) {
  const response = responseRecorder()
  await handler(request(action, method, body, query), response as unknown as VercelResponse)
  return response
}

describe('consolidated quiz API routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.createQuizSession.mockResolvedValue(sessionId)
    mocks.getParticipant.mockResolvedValue({ id: sessionId, source_referral_link_id: null })
    mocks.resolveReferralLink.mockResolvedValue(null)
    mocks.authorizeSession.mockResolvedValue(true)
    mocks.saveQuizAnswer.mockResolvedValue({ status: 'saved' })
    mocks.getQuizSession.mockResolvedValue({ status: 'in_progress', answers: {} })
    mocks.calculateAndStoreResult.mockResolvedValue({ status: 'ready', result: { id: 'result-1' } })
  })

  it('routes quiz start and preserves its response contract', async () => {
    const response = await call('start', 'POST', { quiz_version: 'v1' })
    expect(response.code).toBe(201)
    expect(response.body).toEqual({ session_id: sessionId, quiz_version: 'v1' })
  })

  it('routes quiz answer and validates the request', async () => {
    const response = await call('answer', 'POST', { session_id: sessionId, question_id: 'q01', option_id: 'C' })
    expect(response.code).toBe(200)
    expect(response.body).toEqual({ status: 'saved' })
    expect(mocks.saveQuizAnswer).toHaveBeenCalledWith(sessionId, 'q01', 'C')
    expect((await call('answer', 'POST', { session_id: 'bad', question_id: 'q01', option_id: 'A' })).code).toBe(400)
  })

  it('routes resume, result, and the complete alias', async () => {
    expect((await call('session', 'GET', undefined, { session_id: sessionId })).code).toBe(200)
    expect((await call('result', 'POST', { session_id: sessionId })).code).toBe(200)
    expect((await call('complete', 'POST', { session_id: sessionId })).code).toBe(200)
  })

  it('rejects wrong method, unknown action, and non-owned sessions', async () => {
    expect((await call('start', 'GET')).code).toBe(405)
    expect((await call('unknown', 'POST')).code).toBe(404)
    mocks.authorizeSession.mockResolvedValueOnce(false)
    expect((await call('answer', 'POST', { session_id: sessionId, question_id: 'q01', option_id: 'A' })).code).toBe(403)
  })
})
