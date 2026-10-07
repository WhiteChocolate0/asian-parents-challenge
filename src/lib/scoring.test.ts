import { describe, expect, it } from 'vitest'
import { calculateResult, tally } from './scoring'

describe('quiz scoring', () => {
  it('calculates a money persona from mixed answer data', () => {
    const answers = Object.fromEntries(Array.from({ length: 15 }, (_, i) => [`q${String(i + 1).padStart(2, '0')}`, 'B']))
    answers.q06 = 'B'; answers.q11 = 'B'; answers.q13 = 'B'; answers.q15 = 'A'
    expect(calculateResult(answers).primary).toBe('money')
  })
  it('uses stage three and fixed priority to resolve ties deterministically', () => {
    const result = calculateResult({ q11: 'A', q14: 'A' })
    expect(result.primary).toBe('safety')
    expect(tally({ q01: 'B' }).money).toBeGreaterThan(0)
  })
})
