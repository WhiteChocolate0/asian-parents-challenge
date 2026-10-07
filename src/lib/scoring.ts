import type { Dimension, Scores } from '../types'
import { questions, profiles } from '../data/quiz'

export const dimensions: Dimension[] = ['money', 'safety', 'face', 'tradition']
const tiePriority: Dimension[] = ['safety', 'money', 'face', 'tradition']

export function tally(answers: Record<string, string>): Scores {
  return questions.reduce<Scores>((total, question) => {
    const option = question.options.find((item) => item.key === answers[question.id])
    if (!option) return total
    dimensions.forEach((dimension) => { total[dimension] += option.scores[dimension] })
    return total
  }, { money: 0, safety: 0, face: 0, tradition: 0 })
}

// Stage 3 resolves ties first; the fixed priority makes remaining ties deterministic.
export function calculateResult(answers: Record<string, string>) {
  const scores = tally(answers)
  const stageThree = tally(Object.fromEntries(Object.entries(answers).filter(([id]) => Number(id.slice(1)) >= 11)))
  const highest = Math.max(...dimensions.map((dimension) => scores[dimension]))
  const candidates = dimensions.filter((dimension) => scores[dimension] === highest)
  const stageHighest = Math.max(...candidates.map((dimension) => stageThree[dimension]))
  const primary = candidates.filter((dimension) => stageThree[dimension] === stageHighest).sort((a, b) => tiePriority.indexOf(a) - tiePriority.indexOf(b))[0]
  const secondary = dimensions.filter((dimension) => dimension !== primary).sort((a, b) => scores[b] - scores[a] || tiePriority.indexOf(a) - tiePriority.indexOf(b))[0]
  const defense = Math.min(5, Math.max(1, Math.round((scores[primary] / 33) * 5)))
  return { scores, primary, secondary, profile: profiles[primary], defense }
}
