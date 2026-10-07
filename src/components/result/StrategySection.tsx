import type { ResultViewModel } from './types'
import { SectionHeading } from './ResultInsightSection'

export function StrategySection({ result }: { result: ResultViewModel }) {
  const doList = result.profile.doList ?? [result.profile.strategy]
  const avoidList = result.profile.avoidList ?? ['避免只說結論，沒有說明考量']
  return (
    <section className="strategy-section" aria-labelledby="strategy-title">
      <SectionHeading id="strategy-title" kicker="03 / FIELD GUIDE" title="破解攻略" />
      <div className="strategy-card">
        <div className="strategy-card__column">
          <h3><span aria-hidden="true">✓</span> 可以先說</h3>
          <ul>{doList.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
        <div className="strategy-card__column strategy-card__column--avoid">
          <h3><span aria-hidden="true">×</span> 先別急著說</h3>
          <ul>{avoidList.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
        <small>把討論留在同一隊，攻略才有機會生效。</small>
      </div>
    </section>
  )
}
