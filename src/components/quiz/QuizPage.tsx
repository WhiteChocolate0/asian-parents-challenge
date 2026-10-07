import type { OptionKey, Question, QuizOption } from '../../types'
import { BackLink } from '../ui/BackLink'

type QuizPageProps = {
  question: Question
  stageTitle: string
  index: number
  total: number
  selectedOption?: string
  direction: 'forward' | 'backward'
  leaving: 'forward' | 'backward' | null
  locked: boolean
  answerError: boolean
  resultError: boolean
  resultLoading: boolean
  onBack: () => void
  onSelect: (option: OptionKey) => void
  onRetryAnswer: () => void
  onRetryResult: () => void
}

function QuizHeader({ stage, stageTitle, index, total, onBack }: {
  stage: Question['stage']
  stageTitle: string
  index: number
  total: number
  onBack: () => void
}) {
  return <header className="quiz-top">
    <BackLink className="quiz-top__back" onClick={onBack}>上一題</BackLink>
    <div className="quiz-top__meta">
      <span className="quiz-top__stage"><span aria-hidden="true">✦</span> STAGE 0{stage}</span>
      <span className="quiz-top__stage-name">{stageTitle}</span>
      <span key={index} className="quiz-top__counter" aria-label={`第 ${index + 1} 題，共 ${total} 題`}>{index + 1} / {total}</span>
    </div>
    <div className="quiz-top__progress" role="progressbar" aria-label="測驗進度" aria-valuemin={0} aria-valuemax={total} aria-valuenow={index + 1}>
      <span aria-hidden="true" style={{ transform: `scaleX(${(index + 1) / total})` }} />
    </div>
  </header>
}

function QuestionSection({ question, index }: { question: Question; index: number }) {
  const length = Array.from(question.text).length
  const titleSize = length > 40 ? 'long' : length > 25 ? 'medium' : 'short'
  return <section className="quiz-question-block" aria-labelledby="quiz-question-title">
    <p className="quiz-question-block__number">QUESTION {String(index + 1).padStart(2, '0')}</p>
    <h1 id="quiz-question-title" className={`quiz-question-block__title--${titleSize}`}>{question.text}</h1>
  </section>
}

function ChoiceCard({ option, selected, disabled, onSelect }: {
  option: QuizOption
  selected: boolean
  disabled: boolean
  onSelect: (option: OptionKey) => void
}) {
  return <button type="button" role="radio" aria-checked={selected} className={`quiz-choice${selected ? ' is-selected' : ''}`} disabled={disabled} onClick={() => onSelect(option.key)}>
    <span className="quiz-choice__badge" aria-hidden="true">{option.key}</span>
    <span className="quiz-choice__text">{option.text}</span>
    <svg className="quiz-choice__check" aria-hidden="true" viewBox="0 0 20 20" fill="none"><path d="m4 10 4 4 8-8" /></svg>
  </button>
}

function ChoiceList({ question, selectedOption, locked, onSelect }: Pick<QuizPageProps, 'question' | 'selectedOption' | 'locked' | 'onSelect'>) {
  return <div className="quiz-choices" role="radiogroup" aria-labelledby="quiz-question-title">
    {question.options.map((option) => <ChoiceCard key={option.key} option={option} selected={selectedOption === option.key} disabled={locked} onSelect={onSelect} />)}
  </div>
}

export function QuizPage({ question, stageTitle, index, total, selectedOption, direction, leaving, locked, answerError, resultError, resultLoading, onBack, onSelect, onRetryAnswer, onRetryResult }: QuizPageProps) {
  return <main className={`quiz-page quiz-page--stage-${question.stage}`} data-direction={direction} data-leaving={leaving ?? undefined} data-first-question={index === 0}>
    <div className="quiz-page__shell">
      <QuizHeader stage={question.stage} stageTitle={stageTitle} index={index} total={total} onBack={onBack} />
      <div key={question.id} className="quiz-page__question-content">
        <QuestionSection question={question} index={index} />
        <ChoiceList question={question} selectedOption={selectedOption} locked={locked || leaving !== null} onSelect={onSelect} />
      </div>
      {answerError && <div className="request-error quiz-page__error" role="alert"><p>剛剛的答案還沒存成功，再試一次就好。</p><button className="retry-button" type="button" disabled={locked} onClick={onRetryAnswer}>{locked ? '重新連線中…' : '重新儲存'}</button></div>}
      {resultError && <div className="request-error request-error--result quiz-page__error" role="alert"><p>魔王辨識差最後一步，結果剛剛沒有成功載入。</p><button className="retry-button" type="button" disabled={resultLoading} onClick={onRetryResult}>{resultLoading ? '重新連線中…' : '再試一次'}</button></div>}
    </div>
  </main>
}
