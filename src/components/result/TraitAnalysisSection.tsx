import { DIMENSION_LABELS } from '../../config/resultThemes'
import type { Dimension } from '../../types'
import { SectionHeading } from './ResultInsightSection'
import type { ResultViewModel } from './types'

const DIMENSIONS: Dimension[] = ['face', 'money', 'safety', 'tradition']

export function TraitAnalysisSection({ result }: { result: ResultViewModel }) {
  const maxScore = Math.max(1, ...DIMENSIONS.map((dimension) => result.scores[dimension]))

  return (
    <section className="trait-section" aria-labelledby="trait-analysis-title">
      <SectionHeading id="trait-analysis-title" kicker="02 / TRAITS" title="四項防禦傾向" />
      <div className="result-score-list">
        {DIMENSIONS.map((dimension) => {
          const score = Math.max(0, result.scores[dimension])
          const label = DIMENSION_LABELS[dimension]
          return (
            <div className="result-score-row" data-primary={dimension === result.resultType} key={dimension}>
              <span className="result-score-row__label">{label}</span>
              <span className="result-score-row__meter" role="meter" aria-label={`${label}傾向`} aria-valuemin={0} aria-valuemax={maxScore} aria-valuenow={score}>
                <span style={{ width: `${Math.min(100, score / maxScore * 100)}%` }} />
              </span>
              <strong>{score}</strong>
            </div>
          )
        })}
      </div>
      <p className="trait-section__note">條長依這次結果的最高分比較，屬於遊戲化指標。</p>
    </section>
  )
}
