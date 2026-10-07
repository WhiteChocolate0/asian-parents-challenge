import { Icon } from './icons'

interface LineBotCTAProps {
  onOpen: () => void
  loading?: boolean
  error?: boolean
}

export function LineBotCTA({ onOpen, loading = false, error = false }: LineBotCTAProps) {
  return (
    <section className="line-bot-cta" aria-labelledby="line-bot-cta-title">
      <p className="line-bot-cta__eyebrow">NEXT QUEST</p>
      <h2 id="line-bot-cta-title">打完副本，換個方式好好聊。</h2>
      <p>電車解惑所可以協助比較電池、充電、成本、車款與實際使用條件。</p>
      <p>LINE 會開啟一對一聊天並預填安全接續訊息；按下送出後即可帶入結果摘要。</p>
      <button className="line-bot-cta__button" onClick={onOpen} disabled={loading}>
        {loading ? '正在開啟 LINE…' : '帶著結果去問電車解惑所'} {!loading && <Icon name="arrow" />}
      </button>
      {error && <p className="line-bot-cta__error" role="status">目前暫時無法帶入 LINE，測驗結果仍會保留。</p>}
    </section>
  )
}
