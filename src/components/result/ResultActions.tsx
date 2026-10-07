import type { ResultActionsProps } from './types'
import { Icon } from './icons'

export function ResultActions({ onShare, onRestart, isSharing = false, shareStatus, shareLabel = '分享我的魔王卡', restartLabel = '重新挑戰' }: ResultActionsProps) {
  return (
    <div className="result-actions">
      <button className="result-action result-action--share" onClick={onShare} disabled={isSharing}>
        <Icon name="share" />{isSharing ? '正在準備分享卡…' : shareLabel}
      </button>
      <button className="result-action result-action--restart" onClick={onRestart}>
        <Icon name="restart" />{restartLabel}
      </button>
      {shareStatus && <p className="result-actions__status" role="status">{shareStatus}</p>}
    </div>
  )
}
