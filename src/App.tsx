import { useEffect, useMemo, useRef, useState } from 'react'
import { questions, stages } from './data/quiz'
import { clearQuiz, loadQuiz, newSessionId, saveQuiz } from './lib/storage'
import { createLineHandoff, getParticipantMe, getQuizResult, getQuizSession, getSharedResult, openReferral, registerParticipant, saveAnswer, startQuiz } from './lib/api'
import { clearParticipant, clearPendingReferral, getPendingReferral, loadParticipant, saveParticipant, setPendingReferral, type ParticipantIdentity } from './lib/participant'
import { ResultPage } from './components/result/ResultPage'
import { LandingPage } from './components/landing/LandingPage'
import { MissionBriefPage } from './components/brief/MissionBriefPage'
import { QuizPage } from './components/quiz/QuizPage'
import { StageClearPage } from './components/quiz/StageClearPage'

type Screen = 'landing' | 'intro' | 'quiz' | 'stage' | 'stage-entering' | 'loading' | 'result'
const analytics = (event: string) => console.info('[analytics]', event)

const Icon = ({ name }: { name: 'shield' | 'spark' | 'arrow' | 'share' | 'restart' }) => {
  const paths = { shield: <path d="M12 2.8 4.7 6v5.1c0 4.6 3 8.8 7.3 10.1 4.3-1.3 7.3-5.5 7.3-10.1V6L12 2.8Z" />, spark: <path d="m12 2 1.6 6.4L20 10l-6.4 1.6L12 18l-1.6-6.4L4 10l6.4-1.6L12 2Z" />, arrow: <path d="M5 12h14m-6-6 6 6-6 6" />, share: <path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 13v6h14v-6" />, restart: <path d="M19 8a7.5 7.5 0 1 0 .3 7M19 8V3m0 5h-5" /> }
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="icon">{paths[name]}</svg>
}

export default function App() {
  const sharedToken = useMemo(() => window.location.pathname.match(/^\/result\/share\/([^/]+)\/?$/)?.[1] || null, [])
  const entryReferral = useMemo(() => new URLSearchParams(window.location.search).get('ref'), [])
  const initialParticipant = useMemo(loadParticipant, [])
  const existing = useMemo(loadQuiz, [])
  const existingAnswerCount = Object.keys(existing?.answers || {}).length
  const [screen, setScreen] = useState<Screen>('landing')
  const [answers, setAnswers] = useState<Record<string, string>>(existing?.answers || {})
  const [sessionId, setSessionId] = useState(existing?.sessionId || newSessionId())
  const [index, setIndex] = useState(0)
  const [navigationDirection, setNavigationDirection] = useState<'forward' | 'backward'>('forward')
  const [questionLeaving, setQuestionLeaving] = useState<'forward' | 'backward' | null>(null)
  const [locked, setLocked] = useState(false)
  const [resume, setResume] = useState(Boolean(initialParticipant) && existingAnswerCount > 0 && existingAnswerCount < questions.length)
  const [participant, setParticipant] = useState<ParticipantIdentity | null>(initialParticipant)
  const [inviterName, setInviterName] = useState<string | null>(null)
  const [referralLoading, setReferralLoading] = useState(Boolean(entryReferral))
  const [referralError, setReferralError] = useState(false)
  const [referralToken, setReferralToken] = useState<string | null>(entryReferral || getPendingReferral())
  const [registrationOpen, setRegistrationOpen] = useState(false)
  const [registrationLoading, setRegistrationLoading] = useState(false)
  const [registrationError, setRegistrationError] = useState(false)
  const [startLoading, setStartLoading] = useState(false)
  const [startError, setStartError] = useState(false)
  const [landingExiting, setLandingExiting] = useState(false)
  const [resumeLoading, setResumeLoading] = useState(false)
  const [resumeError, setResumeError] = useState(false)
  const [answerError, setAnswerError] = useState<{ questionId: string; optionId: string } | null>(null)
  const [resultLoading, setResultLoading] = useState(false)
  const [resultError, setResultError] = useState(false)
  const [handoffError, setHandoffError] = useState(false)
  const [handoffLoading, setHandoffLoading] = useState(false)
  const [serverResult, setServerResult] = useState<Awaited<ReturnType<typeof getQuizResult>> | null>(null)
  const [sharedResult, setSharedResult] = useState<Awaited<ReturnType<typeof getSharedResult>> | null>(null)
  const [sharedError, setSharedError] = useState(false)
  const resumeRequestActive = useRef(true)
  const referralOpened = useRef(false)
  const questionExitTimer = useRef<number | null>(null)
  useEffect(() => () => { if (questionExitTimer.current !== null) window.clearTimeout(questionExitTimer.current) }, [])
  useEffect(() => {
    if (!sharedToken) return
    void getSharedResult(sharedToken).then(setSharedResult).catch(() => setSharedError(true))
  }, [sharedToken])
  useEffect(() => {
    if (!initialParticipant || sharedToken) return
    void getParticipantMe().then((serverIdentity) => {
      if (!serverIdentity) { clearParticipant(); setParticipant(null); setResume(false); return }
      const verified = { ...initialParticipant, nickname: serverIdentity.nickname }
      saveParticipant(verified)
      setParticipant(verified)
    }).catch(() => { /* Keep the locally remembered identity for a later retry. */ })
  }, [initialParticipant, sharedToken])
  useEffect(() => {
    if (!entryReferral || sharedToken || referralOpened.current) return
    referralOpened.current = true
    if (!/^[A-Za-z0-9_-]{12,64}$/.test(entryReferral)) {
      clearPendingReferral(); setReferralToken(null); setReferralError(true); setReferralLoading(false)
      return
    }
    setPendingReferral(entryReferral)
    void openReferral(entryReferral).then((referral) => {
      setInviterName(referral.inviter_nickname)
      setReferralToken(entryReferral)
    }).catch(() => { clearPendingReferral(); setReferralToken(null); setInviterName(null); setReferralError(true) })
      .finally(() => setReferralLoading(false))
  }, [entryReferral, sharedToken])
  const current = questions[index]
  useEffect(() => { if (Object.keys(answers).length) saveQuiz({ answers, sessionId, updatedAt: new Date().toISOString() }) }, [answers, sessionId])

  const requestResult = async (targetSessionId = sessionId) => {
    setResultError(false)
    setResultLoading(true)
    setLocked(true)
    try {
      const result = await getQuizResult(targetSessionId)
      setServerResult(result)
      setScreen('loading')
    } catch {
      setResultError(true)
      setLocked(false)
    } finally {
      setResultLoading(false)
    }
  }

  const resumeFromServer = async () => {
    if (!existing?.sessionId) return
    setResumeLoading(true)
    setResumeError(false)
    resumeRequestActive.current = true
    try {
      const session = await getQuizSession(existing.sessionId)
      if (!resumeRequestActive.current) return
      const restoredAnswers = session.answers
      setAnswers(restoredAnswers)
      setSessionId(existing.sessionId)
      const answerCount = Object.keys(restoredAnswers).length
      if (session.status === 'completed' || answerCount >= questions.length) {
        // Keep a visible retry surface if refreshing a completed quiz cannot reload its result.
        setIndex(questions.length - 1)
        setScreen('quiz')
        setResume(false)
        await requestResult(existing.sessionId)
      } else {
        setResume(answerCount > 0)
      }
    } catch {
      if (!resumeRequestActive.current) return
      setResume(existingAnswerCount > 0 && existingAnswerCount < questions.length)
      setResumeError(true)
    } finally {
      if (resumeRequestActive.current) setResumeLoading(false)
    }
  }

  useEffect(() => {
    if (sharedToken || entryReferral || !initialParticipant || !existing?.sessionId) return
    void resumeFromServer()
    return () => { resumeRequestActive.current = false }
  }, [sharedToken, entryReferral, initialParticipant, existing?.sessionId])
  useEffect(() => {
    if (sharedToken || screen !== 'loading' || !serverResult) return
    const timer = window.setTimeout(() => { setScreen('result'); analytics('quiz_completed') }, 750)
    return () => clearTimeout(timer)
  }, [screen, serverResult])
  useEffect(() => {
    if (screen !== 'stage-entering') return
    const enterNextQuestion = () => {
      setNavigationDirection('forward')
      setIndex((value) => value + 1)
      setScreen('quiz')
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { enterNextQuestion(); return }
    const timer = window.setTimeout(enterNextQuestion, 650)
    return () => window.clearTimeout(timer)
  }, [screen])

  const moveQuestion = (direction: 'forward' | 'backward', onComplete: () => void) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { onComplete(); return }
    setQuestionLeaving(direction)
    questionExitTimer.current = window.setTimeout(() => {
      questionExitTimer.current = null
      setQuestionLeaving(null)
      onComplete()
    }, direction === 'forward' ? 110 : 170)
  }

  const beginQuiz = async () => {
    if (startLoading) return
    resumeRequestActive.current = false
    setStartError(false)
    setLandingExiting(false)
    setStartLoading(true)
    try {
      const quiz = await startQuiz(referralToken)
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        setLandingExiting(true)
        await new Promise<void>((resolve) => window.setTimeout(resolve, 180))
      }
      clearQuiz(); setAnswers({}); setSessionId(quiz.session_id); setIndex(0); setNavigationDirection('forward'); setQuestionLeaving(null); setResume(false); setServerResult(null)
      clearPendingReferral(); setReferralToken(null); setInviterName(null)
      if (entryReferral) window.history.replaceState({}, '', window.location.pathname)
      setScreen('intro'); analytics('quiz_started')
    } catch { setLandingExiting(false); setStartError(true) }
    finally { setStartLoading(false) }
  }
  const start = () => { if (participant) void beginQuiz(); else { setRegistrationError(false); setRegistrationOpen(true) } }
  const register = async (nickname: string) => {
    if (registrationLoading) return
    setRegistrationError(false)
    setRegistrationLoading(true)
    try {
      const created = await registerParticipant(nickname, referralToken)
      const identity = { participantId: created.participant_id, nickname: created.nickname, token: created.participant_token }
      saveParticipant(identity)
      setParticipant(identity)
      setRegistrationOpen(false)
      await beginQuiz()
    } catch { setRegistrationError(true) }
    finally { setRegistrationLoading(false) }
  }
  const continueQuiz = () => { if (!participant) { setRegistrationOpen(true); return }; resumeRequestActive.current = false; const next = questions.findIndex((question) => !answers[question.id]); setNavigationDirection('forward'); setQuestionLeaving(null); setIndex(next < 0 ? questions.length - 1 : next); setScreen('quiz') }
  const restart = () => { clearQuiz(); setAnswers({}); setSessionId(newSessionId()); setIndex(0); setQuestionLeaving(null); setResume(false); setServerResult(null); setLandingExiting(false); setScreen('landing') }
  const advanceAfterAnswer = () => {
    window.setTimeout(() => {
      if (index === 14) {
        void requestResult()
        return
      }
      if (index === 4 || index === 9) { setLocked(false); analytics('stage_completed'); setScreen('stage') }
      else moveQuestion('forward', () => { setNavigationDirection('forward'); setIndex((value) => value + 1); setLocked(false) })
    }, index === 4 || index === 9 || index === 14 ? 180 : 100)
  }
  const persistAnswer = async (questionId: string, optionId: string) => {
    setLocked(true)
    setAnswerError(null)
    try {
      await saveAnswer(sessionId, questionId, optionId)
      analytics('question_answered')
      advanceAfterAnswer()
    } catch {
      setLocked(false)
      setAnswerError({ questionId, optionId })
    }
  }
  const choose = (key: string) => {
    if (locked || questionLeaving) return
    const next = { ...answers, [current.id]: key }
    setAnswers(next)
    void persistAnswer(current.id, key)
  }
  const openLineHandoff = async () => {
    analytics('line_cta_clicked'); setHandoffError(false); setHandoffLoading(true)
    try {
      if (!serverResult) throw new Error('result unavailable')
      const payload = await createLineHandoff(sessionId)
      window.location.assign(payload.handoffUrl)
    } catch { setHandoffError(true) }
    finally { setHandoffLoading(false) }
  }

  if (sharedToken) {
    if (sharedError) return <main className="page loading"><p className="eyebrow">SHARED RESULT</p><h1>分享結果<br /><em>不存在或已過期</em></h1><button className="primary" onClick={() => window.location.assign('/')}>開始自己的挑戰</button></main>
    if (!sharedResult) return <main className="page loading" aria-live="polite"><div className="scanner"><Icon name="shield" /></div><p className="eyebrow">LOADING</p><h1>正在載入<br /><em>分享結果…</em></h1></main>
    return <ResultPage result={{ ...sharedResult, id: '', resultType: sharedResult.primary }} readOnly onRestart={() => window.location.assign('/')} />
  }

  if (screen === 'landing') return <LandingPage onStart={start} onResume={continueQuiz} onRetryResume={() => void resumeFromServer()} startLoading={startLoading} startError={startError} canResume={resume && !entryReferral} resumeLoading={resumeLoading} resumeError={resumeError} exiting={landingExiting} inviterName={inviterName} referralLoading={referralLoading} referralError={referralError} registrationOpen={registrationOpen} registrationLoading={registrationLoading} registrationError={registrationError} onRegister={(nickname) => void register(nickname)} onCloseRegistration={() => setRegistrationOpen(false)} />

  if (screen === 'intro') return <MissionBriefPage onEnter={() => setScreen('quiz')} onBack={() => { setLandingExiting(false); setScreen('landing') }} />

  if (screen === 'stage') { const upcoming = index === 4 ? 2 : 3; return <StageClearPage upcoming={upcoming} onContinue={() => setScreen('stage-entering')} /> }

  if (screen === 'stage-entering') { const upcoming = index === 4 ? 2 : 3; return <main className={`stage-entry stage-entry--${upcoming}`} aria-live="polite"><p className="stage-entry__label">STAGE 0{upcoming}</p><h1>{stages[upcoming].title}</h1><p className="stage-entry__note">第{upcoming === 2 ? '二' : '三'}關解鎖</p></main> }

  if (screen === 'loading') return <main className="page loading quiz-completion" aria-live="polite"><div className="scanner"><Icon name="shield" /></div><p className="eyebrow">15 / 15 · 挑戰完成</p><h1>分析你的<br /><em>家長魔王中…</em></h1></main>

  if (screen === 'result' && serverResult) return <ResultPage participant={participant} result={{
    id: serverResult.id,
    resultType: serverResult.primary,
    profile: serverResult.profile,
    scores: serverResult.scores,
    defense: serverResult.defense,
    secondary: serverResult.secondary,
  }} onRestart={restart} onLineHandoff={openLineHandoff} handoffLoading={handoffLoading} lineHandoffError={handoffError} />

  return <QuizPage question={current} stageTitle={stages[current.stage].title} index={index} total={questions.length} selectedOption={answers[current.id]} direction={navigationDirection} leaving={questionLeaving} locked={locked} answerError={Boolean(answerError && answerError.questionId === current.id)} resultError={resultError} resultLoading={resultLoading} onBack={() => { if (locked || questionLeaving) return; if (index) moveQuestion('backward', () => { setNavigationDirection('backward'); setIndex((value) => value - 1) }); else setScreen('intro') }} onSelect={choose} onRetryAnswer={() => { if (answerError) void persistAnswer(answerError.questionId, answerError.optionId) }} onRetryResult={() => void requestResult()} />
}
