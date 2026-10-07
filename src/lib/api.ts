import type { Dimension, ResultProfile, Scores } from '../types'
import { identityHeaders } from './participant'

type ApiResult = {
  id: string
  defense_value: number
  persona_key: Dimension
  ability_scores_json: Scores
  result_summary: { secondary: Dimension; profile: ResultProfile }
}
type SharedApiResult = Omit<ApiResult, 'id'>

async function post<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...identityHeaders() },
    body: JSON.stringify(body),
  })
  if (!response.ok) throw new Error('API request failed')
  return response.json() as Promise<T>
}

export async function startQuiz(referralToken?: string | null) {
  return post<{ session_id: string; quiz_version: 'v1' }>('/api/quiz/start', { quiz_version: 'v1', referral_token: referralToken ?? undefined })
}

export async function getQuizSession(sessionId: string) {
  const response = await fetch(`/api/quiz/session?session_id=${encodeURIComponent(sessionId)}`, { headers: identityHeaders() })
  if (!response.ok) throw new Error('Quiz session unavailable')
  return response.json() as Promise<{ status: 'in_progress' | 'completed'; answers: Record<string, 'A' | 'B' | 'C'> }>
}

export async function saveAnswer(sessionId: string, questionId: string, optionId: string) {
  return post<{ status: 'saved' }>('/api/quiz/answer', { session_id: sessionId, question_id: questionId, option_id: optionId })
}

export async function getQuizResult(sessionId: string) {
  const payload = await post<{ result: ApiResult }>('/api/quiz/result', { session_id: sessionId })
  return {
    id: payload.result.id,
    scores: payload.result.ability_scores_json,
    primary: payload.result.persona_key,
    secondary: payload.result.result_summary.secondary,
    profile: payload.result.result_summary.profile,
    defense: payload.result.defense_value,
  }
}

export async function createLineHandoff(sessionId: string) {
  return post<{ handoffUrl: string; expiresAt: string }>('/api/line-handoff', { session_id: sessionId })
}

export async function createShare(quizResultId: string) {
  return post<{ share_token: string; share_url: string }>('/api/share', { quiz_result_id: quizResultId })
}

export async function getSharedResult(token: string) {
  const response = await fetch(`/api/share?token=${encodeURIComponent(token)}`)
  if (!response.ok) throw new Error('Shared result unavailable')
  const payload = await response.json() as { result: SharedApiResult }
  return {
    scores: payload.result.ability_scores_json,
    primary: payload.result.persona_key,
    secondary: payload.result.result_summary.secondary,
    profile: payload.result.result_summary.profile,
    defense: payload.result.defense_value,
  }
}

export async function registerParticipant(nickname: string, referralToken?: string | null) {
  return post<{ participant_id: string; nickname: string; participant_token: string }>('/api/participants', { nickname, referral_token: referralToken ?? undefined })
}

export async function getParticipantMe() {
  const response = await fetch('/api/participants?action=me', { headers: identityHeaders() })
  if (response.status === 401) return null
  if (!response.ok) throw new Error('Participant unavailable')
  return response.json() as Promise<{ participant_id: string; nickname: string; public_leaderboard_opt_in: boolean }>
}

export async function openReferral(token: string) {
  return post<{ inviter_nickname: string }>('/api/referrals?action=open', { referral_token: token })
}

export async function getReferralLink() {
  const response = await fetch('/api/referrals?action=link', { headers: identityHeaders() })
  if (!response.ok) throw new Error('Referral link unavailable')
  return response.json() as Promise<{ referral_token: string; share_url: string }>
}

export type LeaderboardEntry = { rank: number; nickname: string; defense_score: number; persona: Dimension; is_you: boolean }
export type SocialOverview = {
  referral_token: string
  unlocked: boolean
  completed_referrals: number
  circle: LeaderboardEntry[]
  global: LeaderboardEntry[]
  activity: Array<{ nickname: string; defense_score: number | null; completed_at: string }>
  insights: { rank: number | null; percentile: number | null; common_persona: Dimension | null } | null
  public_leaderboard_opt_in: boolean
}

export async function getSocialOverview() {
  const response = await fetch('/api/social', { headers: identityHeaders() })
  if (!response.ok) throw new Error('Social overview unavailable')
  return response.json() as Promise<SocialOverview>
}

export async function setLeaderboardOptIn(value: boolean) {
  const response = await fetch('/api/participants?action=me', {
    method: 'PATCH', headers: { 'Content-Type': 'application/json', ...identityHeaders() },
    body: JSON.stringify({ public_leaderboard_opt_in: value }),
  })
  if (!response.ok) throw new Error('Unable to update public leaderboard preference')
  return response.json() as Promise<{ public_leaderboard_opt_in: boolean }>
}
