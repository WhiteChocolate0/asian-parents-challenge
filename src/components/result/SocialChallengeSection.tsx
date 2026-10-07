import { useState } from 'react'
import type { LeaderboardEntry, SocialOverview } from '../../lib/api'
import { DIMENSION_LABELS } from '../../config/resultThemes'

const PERSONA_SHORT_NAMES = { money: '算盤系魔王', safety: '安全控魔王', face: '比較面子魔王', tradition: '傳統派魔王' }

type Props = {
  overview: SocialOverview | null
  loading: boolean
  error: boolean
  optInBusy: boolean
  optInError: boolean
  onRetry: () => void
  onShare: () => void
  onCopy: () => void
  onOptIn: (value: boolean) => void
  shareUrl: string | null
  shareStatus: string
  shareBusy: boolean
}

function Board({ entries, emptyText }: { entries: LeaderboardEntry[]; emptyText: string }) {
  if (!entries.length) return <p className="social-board__empty">{emptyText}</p>
  return <ol className="social-board">
    {entries.map((entry) => <li key={`${entry.rank}-${entry.nickname}`} className={entry.is_you ? 'social-board__row social-board__row--you' : 'social-board__row'}>
      <span className="social-board__rank">{String(entry.rank).padStart(2, '0')}</span>
      <span className="social-board__person"><strong>{entry.nickname}</strong>{entry.is_you && <small>YOU</small>}<em>{DIMENSION_LABELS[entry.persona]}</em></span>
      <span className="social-board__score">{entry.defense_score}<small>/ 5</small></span>
    </li>)}
  </ol>
}

export function SocialChallengeSection({ overview, loading, error, optInBusy, optInError, onRetry, onShare, onCopy, onOptIn, shareUrl, shareStatus, shareBusy }: Props) {
  const [tab, setTab] = useState<'circle' | 'global'>('circle')
  return <section className="social-challenge" aria-labelledby="social-challenge-title">
    <div className="social-challenge__intro">
      <p className="social-challenge__eyebrow">NEXT CHALLENGE</p>
      <h2 id="social-challenge-title">把挑戰傳給朋友</h2>
      <p>朋友完成測驗，你們的挑戰圈魔王榜就會解鎖。</p>
      {shareUrl && <div className="social-challenge__link"><label htmlFor="referral-link">你的專屬挑戰連結</label><input id="referral-link" readOnly value={shareUrl} onFocus={(event) => event.target.select()} /><button type="button" onClick={onCopy}>複製連結</button></div>}
      <button className="social-challenge__invite" type="button" onClick={onShare} disabled={shareBusy}>{shareBusy ? '正在準備分享…' : '邀請朋友來挑戰 →'}</button>
      {shareStatus && <p className="social-challenge__status" role="status">{shareStatus}</p>}
    </div>
    {loading && <p className="social-challenge__status" role="status">正在整理你的挑戰圈…</p>}
    {error && <div className="request-error" role="alert"><p>挑戰圈暫時無法載入，你的測驗結果仍在這裡。</p><button className="retry-button" type="button" onClick={onRetry}>重新載入</button></div>}
    {overview && <>
      <section className="social-challenge__activity" aria-labelledby="referral-activity-title">
        <h3 id="referral-activity-title">挑戰動態</h3>
        {overview.activity.length ? <ul>{overview.activity.map((item, index) => <li key={`${item.completed_at}-${index}`}><span><strong>{item.nickname}</strong> 完成了你的挑戰！</span><small>{item.defense_score === null ? '已完成' : `魔王防禦值 ${item.defense_score} / 5`}</small></li>)}</ul> : <p>第一位挑戰者還在路上。</p>}
      </section>
      <section className="social-challenge__ranking" aria-labelledby="challenge-board-title">
        <div className="social-challenge__ranking-head"><h3 id="challenge-board-title">挑戰圈魔王榜</h3><span>{overview.completed_referrals} 位挑戰者完成</span></div>
        {!overview.unlocked ? <div className="social-challenge__locked"><span aria-hidden="true">◇</span><strong>你的挑戰圈還很安靜</strong><p>邀請 1 位朋友完成挑戰即可解鎖排行榜。</p><button type="button" disabled={shareBusy} onClick={onShare}>邀請朋友來挑戰</button></div> : <>
          <p className="social-challenge__unlocked">排行榜解鎖！看看誰家的魔王最難攻略。</p>
          <div className="social-challenge__tabs" role="tablist" aria-label="排行榜範圍"><button type="button" role="tab" aria-selected={tab === 'circle'} onClick={() => setTab('circle')}>挑戰圈</button><button type="button" role="tab" aria-selected={tab === 'global'} onClick={() => setTab('global')}>全站</button></div>
          <div role="tabpanel"><Board entries={tab === 'circle' ? overview.circle : overview.global} emptyText={tab === 'circle' ? '第一位挑戰者還在路上。' : '還沒有人選擇加入全站排行榜。'} /></div>
        </>}
      </section>
      <div className="social-challenge__privacy"><label><input type="checkbox" checked={overview.public_leaderboard_opt_in} disabled={optInBusy} onChange={(event) => onOptIn(event.target.checked)} /><span>允許我的暱稱與測驗結果出現在公開排行榜</span></label><small>預設不公開；不勾選也能參加自己的挑戰圈。</small>{optInError && <p role="alert">設定沒有存成功，請再試一次。</p>}</div>
      {overview.unlocked && overview.insights && <section className="social-challenge__insights" aria-label="挑戰圈洞察"><h3>你的挑戰圈觀察</h3><div>{overview.insights.rank && <p>你目前在挑戰圈排名第 <strong>{overview.insights.rank}</strong>。</p>}{overview.insights.percentile !== null && <p>你家的魔王強度超過 <strong>{overview.insights.percentile}%</strong> 的挑戰者。</p>}{overview.insights.common_persona && <p>挑戰圈最常出現：<strong>{PERSONA_SHORT_NAMES[overview.insights.common_persona]}</strong>。</p>}</div><small>只統計你的挑戰圈，屬於趣味互動數據。</small></section>}
    </>}
  </section>
}
