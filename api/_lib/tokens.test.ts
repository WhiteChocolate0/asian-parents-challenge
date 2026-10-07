import { createHash } from 'node:crypto'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  ownedCompletedResultForSession: vi.fn(),
  insertPayload: null as Record<string, unknown> | null,
  tables: [] as string[],
}))

vi.mock('./line-handoff-ownership.js', () => ({ ownedCompletedResultForSession: mocks.ownedCompletedResultForSession }))
vi.mock('./supabase-admin.js', () => ({
  getSupabaseAdmin: () => ({
    schema: () => ({
      from: (table: string) => {
        mocks.tables.push(table)
        const builder = {
          select: () => builder,
          eq: () => builder,
          gt: () => builder,
          limit: async () => ({ data: [], error: null }),
          insert: async (payload: Record<string, unknown>) => {
            mocks.insertPayload = payload
            return { error: null }
          },
        }
        return builder
      },
    }),
  }),
}))

import { createLineToken, LINE_HANDOFF_TTL_MS } from './tokens.js'

describe('LINE handoff token creation', () => {
  beforeEach(() => {
    mocks.ownedCompletedResultForSession.mockReset().mockResolvedValue('owned-result')
    mocks.insertPayload = null
    mocks.tables = []
  })

  it('HANDOFF_CREATE_001 creates a token only after ownership is verified', async () => {
    const result = await createLineToken('owned-session', {} as never)
    expect(mocks.ownedCompletedResultForSession).toHaveBeenCalledWith(expect.anything(), 'owned-session')
    expect(result.status).toBe('created')
  })

  it('HANDOFF_CREATE_002 denies a foreign result before token storage', async () => {
    mocks.ownedCompletedResultForSession.mockResolvedValue(null)
    expect(await createLineToken('foreign-session', {} as never)).toEqual({ status: 'forbidden' })
    expect(mocks.insertPayload).toBeNull()
  })

  it('HANDOFF_CREATE_004 stores only a SHA-256 hash, never the raw token', async () => {
    const result = await createLineToken('owned-session', {} as never)
    expect(result.status).toBe('created')
    if (result.status !== 'created') throw new Error('expected token')
    expect(result.token).toMatch(/^[A-Za-z0-9_-]{43}$/)
    expect(mocks.insertPayload?.token_hash).toBe(createHash('sha256').update(result.token).digest('hex'))
    expect(mocks.insertPayload).not.toHaveProperty('token')
    expect(JSON.stringify(mocks.insertPayload)).not.toContain(result.token)
  })

  it('HANDOFF_CREATE_005 does not log the raw token', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const result = await createLineToken('owned-session', {} as never)
    if (result.status !== 'created') throw new Error('expected token')
    expect([log, error, warn].flatMap((spy) => spy.mock.calls.flat())).not.toContain(result.token)
    log.mockRestore(); error.mockRestore(); warn.mockRestore()
  })

  it('HANDOFF_CREATE_006 uses a 15-minute expiry', async () => {
    const before = Date.now()
    const result = await createLineToken('owned-session', {} as never)
    const expiresAt = result.status === 'created' ? Date.parse(result.expiresAt) : 0
    expect(expiresAt - before).toBeGreaterThanOrEqual(LINE_HANDOFF_TTL_MS - 100)
    expect(expiresAt - before).toBeLessThanOrEqual(LINE_HANDOFF_TTL_MS + 100)
  })
})
