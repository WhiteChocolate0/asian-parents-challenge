import { DefenseScore } from './DefenseScore'
import { ParentCharacter } from './ParentCharacter'
import { ResultActions } from './ResultActions'
import { ResultTitle } from './ResultTitle'
import type { ResultActionsProps, ResultViewModel } from './types'

interface ResultHeroCardProps extends ResultActionsProps {
  result: ResultViewModel
  nickname?: string
}

export function ResultHeroCard({ result, nickname, ...actions }: ResultHeroCardProps) {
  return (
    <section className="result-hero-card" aria-label="挑戰結果">
      <div className="result-hero-card__topline"><span className="font-display">亞洲父母挑戰</span><span className="result-hero-card__tag">測驗結果 / RESULT</span></div>
      <div className="result-hero-card__layout">
        <div className="result-hero-card__intro">
          {nickname && <p className="result-hero-card__nickname">{nickname}的測驗結果</p>}
          <ResultTitle title="你的家長魔王是——" name={result.profile.name} />
          <p className="result-hero-card__one-liner"><span>破關線索</span>{result.profile.quote}</p>
        </div>
        <ParentCharacter type={result.resultType} />
        <div className="result-hero-card__summary"><DefenseScore value={result.defense} /></div>
        <ResultActions {...actions} />
      </div>
    </section>
  )
}
