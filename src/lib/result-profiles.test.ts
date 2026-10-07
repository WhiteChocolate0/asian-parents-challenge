import { describe, expect, it } from 'vitest'
import { profiles } from '../data/quiz'

describe('result profile content', () => {
  it('provides empathy, communication guidance, and actionable do/avoid lists for all four personas', () => {
    expect(Object.keys(profiles).sort()).toEqual(['face', 'money', 'safety', 'tradition'])
    for (const profile of Object.values(profiles)) {
      expect(profile.personality?.length).toBeGreaterThan(10)
      expect(profile.communicationTip?.length).toBeGreaterThan(10)
      expect(profile.doList?.length).toBeGreaterThanOrEqual(2)
      expect(profile.avoidList?.length).toBeGreaterThanOrEqual(2)
    }
  })
})
