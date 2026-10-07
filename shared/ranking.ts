export type RankedCandidate = { defense_value: number; completed_at: string; participant_id: string }

export function compareRankedCandidates(a: RankedCandidate, b: RankedCandidate) {
  return b.defense_value - a.defense_value ||
    Date.parse(a.completed_at) - Date.parse(b.completed_at) ||
    a.participant_id.localeCompare(b.participant_id)
}
