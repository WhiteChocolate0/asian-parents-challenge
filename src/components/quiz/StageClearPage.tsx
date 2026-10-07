import { stages } from '../../data/quiz'
import { PrimaryActionButton } from '../ui/PrimaryActionButton'

type StageClearPageProps = {
  upcoming: 2 | 3
  onContinue: () => void
}

export function StageClearPage({ upcoming, onContinue }: StageClearPageProps) {
  const stage = stages[upcoming]

  return <main className={`stage-clear stage-clear--${upcoming}`}>
    <div className="stage-clear__shell">
      <section className="stage-clear__completed" aria-labelledby="stage-clear-title">
        <span className="stage-clear__badge" aria-hidden="true">
          <svg viewBox="0 0 48 48" fill="none"><path d="M24 5 9 11v11c0 10 6 17 15 21 9-4 15-11 15-21V11L24 5Z" /><path d="m17 24 5 5 10-11" /></svg>
        </span>
        <p className="stage-clear__eyebrow">STAGE {String(upcoming - 1).padStart(2, '0')} CLEAR</p>
        <h1 id="stage-clear-title">{stage.clear}</h1>
        <p className="stage-clear__lead">{stage.transitionLead}</p>
      </section>

      <section className="stage-clear__next" aria-label={`下一關：${stage.title}`}>
        <p className="stage-clear__next-label">{stage.transitionCopy} <span aria-hidden="true">·</span> 0{upcoming} / 03</p>
        <h2>{stage.title}</h2>
        <p className="stage-clear__detail">{stage.detail}</p>
        <PrimaryActionButton className="stage-clear__button" onClick={onContinue}>{stage.action}</PrimaryActionButton>
      </section>
    </div>
  </main>
}
