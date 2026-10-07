export type ParticipantIdentity = { participantId: string; nickname: string; token: string }

const idKey = 'asian_parents_participant_id'
const nicknameKey = 'asian_parents_nickname'
const tokenKey = 'asian_parents_participant_token'
const referralKey = 'asian_parents_active_referral'

export function loadParticipant(): ParticipantIdentity | null {
  const participantId = localStorage.getItem(idKey)
  const nickname = localStorage.getItem(nicknameKey)
  const token = localStorage.getItem(tokenKey)
  return participantId && nickname && token ? { participantId, nickname, token } : null
}

export function saveParticipant(identity: ParticipantIdentity) {
  localStorage.setItem(idKey, identity.participantId)
  localStorage.setItem(nicknameKey, identity.nickname)
  localStorage.setItem(tokenKey, identity.token)
}

export function clearParticipant() {
  localStorage.removeItem(idKey)
  localStorage.removeItem(nicknameKey)
  localStorage.removeItem(tokenKey)
}

export function identityHeaders(): Record<string, string> {
  const identity = loadParticipant()
  return identity ? { 'X-Participant-Id': identity.participantId, 'X-Participant-Token': identity.token } : {}
}

export function getPendingReferral() { return localStorage.getItem(referralKey) }
export function setPendingReferral(token: string) { localStorage.setItem(referralKey, token) }
export function clearPendingReferral() { localStorage.removeItem(referralKey) }
