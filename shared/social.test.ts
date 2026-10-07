import { describe, expect, it } from 'vitest'
import { normalizeNickname } from './nickname'
import { compareRankedCandidates } from './ranking'

describe('challenge identity and ranking rules', () => {
  it('normalizes a valid nickname and rejects invalid input', () => {
    expect(normalizeNickname('  小安  ')).toBe('小安')
    expect(normalizeNickname(' ')).toBeNull()
    expect(normalizeNickname('小')).toBeNull()
    expect(normalizeNickname('abcdefghijklm')).toBeNull()
    expect(normalizeNickname('小安\u0001')).toBeNull()
    expect(normalizeNickname('小安\u202e')).toBeNull()
    expect(normalizeNickname('fuck123')).toBeNull()
  })

  it('sorts score descending, then earlier completion, then stable participant id', () => {
    const rows = [
      { participant_id: 'c', defense_value: 4, completed_at: '2026-01-01T02:00:00Z' },
      { participant_id: 'b', defense_value: 5, completed_at: '2026-01-01T01:00:00Z' },
      { participant_id: 'a', defense_value: 5, completed_at: '2026-01-01T01:00:00Z' },
    ]
    expect(rows.sort(compareRankedCandidates).map((row) => row.participant_id)).toEqual(['a', 'b', 'c'])
  })
})
