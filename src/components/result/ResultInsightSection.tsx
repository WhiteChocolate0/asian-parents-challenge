import type { ReactNode } from 'react'
import type { ResultViewModel } from './types'
import { InsightCard } from './InsightCard'
import { CoreMoveQuote } from './CoreMoveQuote'

interface ResultInsightSectionProps {
  result: ResultViewModel
}

export function ResultInsightSection({ result }: ResultInsightSectionProps) {
  const profile = result.profile
  return (
    <section className="result-section" aria-labelledby="result-insight-title">
      <SectionHeading id="result-insight-title" kicker="01 / BOSS PROFILE" title="魔王圖鑑" />
      <div className="insight-grid">
        <InsightCard icon="heart" label="他們真正擔心的是" text={profile.concern} />
        <InsightCard icon="brain" label="魔王內心 OS" text={profile.personality ?? profile.quote} />
        <InsightCard icon="chat" label="溝通突破口" text={profile.communicationTip ?? profile.strategy} />
      </div>
      <CoreMoveQuote label="魔王經典台詞・核心招式" quote={profile.skill} />
    </section>
  )
}

export function SectionHeading({ id, kicker, title, children }: { id: string; kicker: string; title: string; children?: ReactNode }) {
  return <header className="result-section__heading"><p>{kicker}</p><h2 id={id}>{title}</h2>{children}</header>
}
