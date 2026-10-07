import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getParticipant: vi.fn(),
  session: { participant_id: 'participant-owner' as string | null, status: 'completed' as string },
  result: { id: 'owned-result', participant_id: 'participant-owner' as string | null },
}))

vi.mock('./social.js', () => ({ getParticipant: mocks.getParticipant }))
vi.mock('./supabase-admin.js', () => ({
  getSupabaseAdmin: () => ({
    schema: () => ({
      from: (table: string) => {
        const row = table === 'quiz_sessions' ? mocks.session : mocks.result
        const builder = {
          select: () => builder,
          eq: () => builder,
          maybeSingle: async () => ({ data: row, error: null }),
        }
        return builder
      },
    }),
  }),
}))

import { ownedCompletedResultForSession } from './line-handoff-ownership.js'

describe('quiz result ownership for LINE handoff', () => {
  beforeEach(() => {
    mocks.getParticipant.mockReset().mockResolvedValue({ id: 'participant-owner' })
    mocks.session.participant_id = 'participant-owner'
    mocks.session.status = 'completed'
    mocks.result.id = 'owned-result'
    mocks.result.participant_id = 'participant-owner'
  })

  it('HANDOFF_CREATE_001 permits the participant who owns the result session', async () => {
    expect(await ownedCompletedResultForSession({} as never, 'session-owner')).toBe('owned-result')
  })

  it('HANDOFF_CREATE_002 denies a foreign result even when the caller knows its UUID', async () => {
    mocks.session.participant_id = 'someone-else'
    expect(await ownedCompletedResultForSession({} as never, 'foreign-session-id')).toBeNull()
  })

  it('denies unowned legacy sessions and unauthenticated callers', async () => {
    mocks.session.participant_id = null
    expect(await ownedCompletedResultForSession({} as never, 'legacy-session')).toBeNull()
    mocks.getParticipant.mockResolvedValueOnce(null)
    expect(await ownedCompletedResultForSession({} as never, 'session-owner')).toBeNull()
  })

  it('rejects in-progress sessions and results with a mismatched participant', async () => {
    mocks.session.status = 'in_progress'
    expect(await ownedCompletedResultForSession({} as never, 'session-owner')).toBeNull()
    mocks.session.status = 'completed'
    mocks.result.participant_id = 'someone-else'
    expect(await ownedCompletedResultForSession({} as never, 'session-owner')).toBeNull()
  })
})
