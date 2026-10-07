export interface StoredQuiz { answers: Record<string, string>; sessionId: string; updatedAt: string }
const key = 'asian-parents-challenge-v1'

export function loadQuiz(): StoredQuiz | null {
  try { return JSON.parse(localStorage.getItem(key) || 'null') } catch { return null }
}
export function saveQuiz(quiz: StoredQuiz) { localStorage.setItem(key, JSON.stringify(quiz)) }
export function clearQuiz() { localStorage.removeItem(key) }
export function newSessionId() { return crypto.randomUUID() }
