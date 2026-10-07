import type { Dimension, ResultProfile, Scores } from '../../types'

export interface ResultViewModel {
  id: string
  resultType: Dimension
  profile: ResultProfile
  scores: Scores
  defense: number
  secondary: Dimension
}

export interface ResultActionsProps {
  onShare: () => void
  onRestart: () => void
  isSharing?: boolean
  shareStatus?: string
  shareLabel?: string
  restartLabel?: string
}
