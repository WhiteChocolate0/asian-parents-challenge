import bossIllustration from '../../assets/images/landing/長輩評審團細長含女生.png'
import bossIllustrationWebp from '../../assets/images/landing/長輩評審團細長含女生.webp'
import { PrimaryActionButton } from '../ui/PrimaryActionButton'
import { NicknameDialog } from './NicknameDialog'

type LandingPageProps = {
  onStart: () => void
  onResume: () => void
  onRetryResume: () => void
  startLoading: boolean
  startError: boolean
  canResume: boolean
  resumeLoading: boolean
  resumeError: boolean
  exiting: boolean
  inviterName: string | null
  referralLoading: boolean
  referralError: boolean
  registrationOpen: boolean
  registrationLoading: boolean
  registrationError: boolean
  onRegister: (nickname: string) => void
  onCloseRegistration: () => void
}

function LandingHeader() {
  return <header className="landing-header">
    <p className="landing-hero__eyebrow">亞洲父母挑戰 <span>ASIAN PARENTS CHALLENGE</span></p>
    <span className="landing-header__privacy">
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="M12 2.8 4.7 6v5.1c0 4.6 3 8.8 7.3 10.1 4.3-1.3 7.3-5.5 7.3-10.1V6L12 2.8Z" /></svg>
      匿名作答
    </span>
  </header>
}

function HeroCopy({ inviterName, referralLoading, referralError }: { inviterName: string | null; referralLoading: boolean; referralError: boolean }) {
  return <div className="landing-hero__copy">
    {referralLoading && <p className="landing-hero__invitation" role="status">正在確認朋友的挑戰…</p>}
    {inviterName && <p className="landing-hero__invitation">{inviterName} 向你發起了亞洲父母挑戰</p>}
    {referralError && <p className="landing-hero__invitation" role="alert">挑戰連結暫時無法辨識，你仍可以直接挑戰。</p>}
    <h1 className="landing-hero__title" id="landing-title">
      <span>亞洲父母</span>
      <em>溝通生存戰</em>
    </h1>
    <p className="landing-hero__subtitle">你的爸媽，是哪一種<mark>「家長魔王」</mark>？</p>
    <p className="landing-hero__description">15 個熟悉到不行的家庭情境，<br className="landing-hero__description-break" />看看你家的防禦系統是哪一型。</p>
  </div>
}

function BossHeroVisual() {
  return <figure className="boss-hero-visual">
    <span className="boss-hero-visual__glow" aria-hidden="true" />
    <span className="boss-hero-visual__orb boss-hero-visual__orb--left" aria-hidden="true" />
    <span className="boss-hero-visual__orb boss-hero-visual__orb--right" aria-hidden="true" />
    <span className="boss-hero-visual__ring" aria-hidden="true" />
    <span className="boss-hero-visual__ground" aria-hidden="true" />
    <span className="boss-hero-visual__spark boss-hero-visual__spark--one" aria-hidden="true">✦</span>
    <span className="boss-hero-visual__spark boss-hero-visual__spark--two" aria-hidden="true">✧</span>
    <div className="boss-hero-visual__inner">
      <picture>
        <source srcSet={bossIllustrationWebp} type="image/webp" />
        <img src={bossIllustration} width={941} height={1672} alt="四位家長魔王面對匿名挑戰者的主視覺插畫" loading="eager" decoding="async" fetchPriority="high" />
      </picture>
    </div>
  </figure>
}

function QuizMeta() {
  return <ul className="landing-meta" aria-label="測驗資訊">
    <li>15 題</li>
    <li>快速測驗</li>
    <li>匿名作答</li>
  </ul>
}

function StartChallengeCTA({ onStart, onResume, onRetryResume, startLoading, startError, canResume, resumeLoading, resumeError }: LandingPageProps) {
  return <div className="landing-hero__actions">
    <QuizMeta />
    <div className="landing-start-entrance">
      <PrimaryActionButton className="landing-start-button" disabled={startLoading} onClick={onStart} showArrow={!startLoading}>{startLoading ? '重新連線中…' : '開始挑戰'}</PrimaryActionButton>
    </div>
    <p className="landing-hero__hint">沒有標準答案，選最像你家的就好。</p>
    {startError && <div className="request-error landing-hero__error" role="alert"><p>現在還沒能開始挑戰，再試一次就好。</p><button className="retry-button" type="button" disabled={startLoading} onClick={onStart}>{startLoading ? '重新連線中…' : '再試一次'}</button></div>}
    {canResume && <button className="landing-resume-button" type="button" disabled={resumeLoading || startLoading} onClick={onResume}>{resumeLoading ? '讀取進度中…' : '繼續剛剛的挑戰'}</button>}
    {resumeError && <div className="request-error landing-hero__error" role="alert"><p>暫時無法讀取先前進度，已保留本機作答。</p><button className="retry-button" type="button" disabled={resumeLoading} onClick={onRetryResume}>{resumeLoading ? '重新連線中…' : '重新連線'}</button></div>}
  </div>
}

export function LandingPage(props: LandingPageProps) {
  return <main className={`landing-page${props.exiting ? ' landing-page--exiting' : ''}`}>
    <div className="landing-page__shell">
      <LandingHeader />
      <section className="landing-hero" aria-labelledby="landing-title">
        <HeroCopy inviterName={props.inviterName} referralLoading={props.referralLoading} referralError={props.referralError} />
        <BossHeroVisual />
        <StartChallengeCTA {...props} />
      </section>
    </div>
    <NicknameDialog open={props.registrationOpen} loading={props.registrationLoading} serverError={props.registrationError} onSubmit={props.onRegister} onClose={props.onCloseRegistration} />
  </main>
}
