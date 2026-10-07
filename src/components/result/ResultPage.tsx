import { useCallback, useEffect, useState, type CSSProperties } from 'react'
import type { ResultViewModel } from './types'
import { RESULT_THEMES } from '../../config/resultThemes'
import { LineBotCTA } from './LineBotCTA'
import { ResultHeroCard } from './ResultHeroCard'
import { ResultInsightSection } from './ResultInsightSection'
import { SharePreviewSection } from './SharePreviewSection'
import { StrategySection } from './StrategySection'
import { TraitAnalysisSection } from './TraitAnalysisSection'
import { createShare, getReferralLink, getSocialOverview, setLeaderboardOptIn, type SocialOverview } from '../../lib/api'
import type { ParticipantIdentity } from '../../lib/participant'
import { SocialChallengeSection } from './SocialChallengeSection'

interface ResultPageProps {
  result: ResultViewModel
  onRestart: () => void
  onLineHandoff?: () => Promise<void>
  handoffLoading?: boolean
  lineHandoffError?: boolean
  readOnly?: boolean
  participant?: ParticipantIdentity | null
}

export function ResultPage({ result, onRestart, onLineHandoff, handoffLoading = false, lineHandoffError = false, readOnly = false, participant }: ResultPageProps) {
  const theme = RESULT_THEMES[result.resultType]
  const themeStyle = { '--result-accent': theme.storyAccent, '--result-halo': theme.halo, '--result-surface': theme.surface } as CSSProperties
  const [shareStatus, setShareStatus] = useState('')
  const [isSharing, setIsSharing] = useState(false)
  const [shareCanvas, setShareCanvas] = useState<HTMLCanvasElement | null>(null)
  const [social, setSocial] = useState<SocialOverview | null>(null)
  const [referralToken, setReferralToken] = useState<string | null>(null)
  const [socialLoading, setSocialLoading] = useState(Boolean(participant && !readOnly))
  const [socialError, setSocialError] = useState(false)
  const [optInBusy, setOptInBusy] = useState(false)
  const [optInError, setOptInError] = useState(false)
  const onCanvasReady = useCallback((canvas: HTMLCanvasElement | null) => setShareCanvas(canvas), [])

  const loadSocial = useCallback(async () => {
    if (!participant || readOnly) return
    setSocialLoading(true)
    setSocialError(false)
    try { setSocial(await getSocialOverview()) }
    catch { setSocialError(true) }
    finally { setSocialLoading(false) }
  }, [participant, readOnly])

  useEffect(() => { void loadSocial() }, [loadSocial])
  useEffect(() => {
    if (!participant || readOnly) return
    void getReferralLink().then((link) => setReferralToken(link.referral_token)).catch(() => { /* Share button can retry. */ })
  }, [participant, readOnly])
  const shareUrl = referralToken ? new URL(`/?ref=${encodeURIComponent(referralToken)}`, window.location.origin).toString() : null

  const downloadCard = () => {
    const canvas = shareCanvas
    if (!canvas) return setShareStatus('分享卡正在準備，請稍後再試。')
    setIsSharing(true)
    canvas.toBlob((blob) => {
      setIsSharing(false)
      if (!blob) return setShareStatus('目前無法產生分享卡，請稍後再試。')
      const link = document.createElement('a')
      link.download = '亞洲父母挑戰-我的魔王卡.png'
      link.href = URL.createObjectURL(blob)
      link.click()
      window.setTimeout(() => URL.revokeObjectURL(link.href), 1000)
      setShareStatus('魔王卡已下載，準備發給隊友吧。')
    }, 'image/png')
  }

  const share = async () => {
    if (!result.id || readOnly) return setShareStatus('此公開結果可以下載魔王卡分享。')
    setIsSharing(true)
    try {
      const url = participant
        ? new URL(`/?ref=${encodeURIComponent(referralToken ?? (await getReferralLink()).referral_token)}`, window.location.origin).toString()
        : new URL((await createShare(result.id)).share_url, window.location.origin).toString()
      if (navigator.share) await navigator.share({ title: '亞洲父母挑戰｜來接受我的挑戰', text: '你家的家長魔王是哪一型？來挑戰看看！', url })
      else {
        await navigator.clipboard.writeText(url)
        setShareStatus('專屬挑戰連結已複製。')
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') setShareStatus('已取消分享。')
      else setShareStatus('分享連結建立失敗，請稍後再試。')
    } finally {
      setIsSharing(false)
    }
  }

  const copyReferral = async () => {
    if (!shareUrl) return
    try { await navigator.clipboard.writeText(shareUrl); setShareStatus('專屬挑戰連結已複製。') }
    catch { setShareStatus('無法自動複製，請選取連結後手動複製。') }
  }

  const setOptIn = async (value: boolean) => {
    if (!social || optInBusy) return
    setOptInBusy(true)
    setOptInError(false)
    try {
      await setLeaderboardOptIn(value)
      setSocial({ ...social, public_leaderboard_opt_in: value })
      await loadSocial()
    } catch { setOptInError(true) }
    finally { setOptInBusy(false) }
  }

  return (
    <main className="result-page" data-result-type={result.resultType} style={themeStyle}>
      <div className="result-page__shell">
      <ResultHeroCard
        result={result}
        nickname={participant?.nickname}
        onShare={() => void (readOnly ? downloadCard() : share())}
        onRestart={onRestart}
        isSharing={isSharing}
        shareStatus={shareStatus}
        shareLabel={readOnly ? '下載魔王卡' : participant ? '邀請朋友挑戰' : undefined}
        restartLabel={readOnly ? '我也要挑戰' : undefined}
      />
      <div className="result-page__details">
        <div className="result-page__analysis-grid">
          <ResultInsightSection result={result} />
          <TraitAnalysisSection result={result} />
        </div>
        <StrategySection result={result} />
        <SharePreviewSection result={result} nickname={participant?.nickname} onDownload={downloadCard} onCanvasReady={onCanvasReady} />
        {participant && !readOnly && <SocialChallengeSection overview={social} loading={socialLoading} error={socialError} optInBusy={optInBusy} optInError={optInError} onRetry={() => void loadSocial()} onShare={() => void share()} onCopy={() => void copyReferral()} onOptIn={(value) => void setOptIn(value)} shareUrl={shareUrl} shareStatus={shareStatus} shareBusy={isSharing} />}
        {onLineHandoff && !readOnly && <LineBotCTA onOpen={() => void onLineHandoff()} loading={handoffLoading} error={lineHandoffError} />}
      </div>
      <footer className="result-page__footer">本測驗為趣味互動內容，結果不代表心理診斷。</footer>
      </div>
    </main>
  )
}
