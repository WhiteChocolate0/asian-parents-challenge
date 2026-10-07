import { questions, stages } from '../../data/quiz'
import { BackLink } from '../ui/BackLink'
import { PrimaryActionButton } from '../ui/PrimaryActionButton'

type MissionBriefPageProps = {
  onBack: () => void
  onEnter: () => void
}

const stageNumbers = [1, 2, 3] as const
const stageShortNames = ['日常', '消費', '決策'] as const

function MissionHeading() {
  return <section className="mission-heading" aria-labelledby="mission-title">
    <p className="mission-heading__eyebrow">MISSION BRIEF</p>
    <h1 id="mission-title" className="mission-heading__title"><span>準備進入</span><strong>家庭副本</strong></h1>
    <p className="mission-heading__summary">三道關卡，看看你家的防禦系統是哪一型。</p>
  </section>
}

function MissionStageMap() {
  return <section className="mission-stage-map" aria-label="測驗關卡預覽">
    <p className="mission-stage-map__count">{stageNumbers.length} STAGES <span aria-hidden="true">·</span> {questions.length} QUESTIONS</p>
    <ol className="mission-stage-map__route">
      {stageNumbers.map((number, index) => <li key={number} className={number === 1 ? 'is-current' : ''} aria-label={`第 ${number} 關：${stages[number].title}`}>
        <span className="mission-stage-map__number">0{number}</span>
        <span className="mission-stage-map__dot" aria-hidden="true" />
        <span className="mission-stage-map__short">{stageShortNames[index]}</span>
        <span className="mission-stage-map__full">{stages[number].title}</span>
      </li>)}
    </ol>
  </section>
}

function NextStageCard({ onEnter }: Pick<MissionBriefPageProps, 'onEnter'>) {
  return <section className="mission-next" aria-label="進入第一關">
    <p className="mission-next__label">NEXT <span>STAGE 01</span></p>
    <h2>{stages[1].title}</h2>
    <p className="mission-next__description">看看平常最熟悉的家庭對話，第一關就從日常開始。</p>
    <PrimaryActionButton className="mission-next__button" onClick={onEnter}>進入第一關</PrimaryActionButton>
  </section>
}

export function MissionBriefPage({ onBack, onEnter }: MissionBriefPageProps) {
  return <main className="mission-brief">
    <div className="mission-brief__shell">
      <BackLink className="mission-brief__back" onClick={onBack}>回首頁</BackLink>
      <div className="mission-brief__layout">
        <MissionHeading />
        <MissionStageMap />
        <NextStageCard onEnter={onEnter} />
      </div>
    </div>
  </main>
}
