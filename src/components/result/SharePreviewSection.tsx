import type { ResultViewModel } from './types'
import { SectionHeading } from './ResultInsightSection'
import { ShareCard } from './ShareCard'

interface SharePreviewSectionProps {
  result: ResultViewModel
  onDownload: () => void
  onCanvasReady: (canvas: HTMLCanvasElement | null) => void
  nickname?: string
}

export function SharePreviewSection({ result, onDownload, onCanvasReady, nickname }: SharePreviewSectionProps) {
  return (
    <section className="share-preview-section" aria-labelledby="share-preview-title">
      <SectionHeading id="share-preview-title" kicker="04 / SHARE CARD" title="把魔王卡帶走" />
      <div className="share-preview-section__content">
        <ShareCard result={result} nickname={nickname} onReady={onCanvasReady} />
        <div className="share-preview-section__aside">
          <span className="share-preview-section__format">9:16 · 1080 × 1920</span>
          <h3>這張很適合發限動。</h3>
          <p>存成 PNG、傳給朋友，看看誰家的家長魔王最難攻略。</p>
          <button className="result-action result-action--share" onClick={onDownload}>下載 PNG 魔王卡</button>
          <small>分享的是測驗結果卡，不會顯示你的作答紀錄。</small>
        </div>
      </div>
    </section>
  )
}
