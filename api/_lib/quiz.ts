import { randomUUID } from 'node:crypto'
import { getSupabaseAdmin } from './supabase-admin.js'
import { recordReferralEvent, type Participant } from './social.js'

export const OPTION_KEYS = ['A', 'B', 'C'] as const
export type OptionKey = typeof OPTION_KEYS[number]
const DIMENSIONS = ['money', 'safety', 'face', 'tradition'] as const
const TIE_PRIORITY = ['safety', 'money', 'face', 'tradition'] as const

const profiles = {
  money: { name: '算盤系・極致省錢大魔王', skill: '「舊的明明還能用！」', concern: '嘴上一直問花多少，其實更擔心你剛出社會就做出超出負擔的決定。', strategy: '拿出客觀數字、長期成本與可負擔的規劃，會比硬碰硬更有用。', quote: '拿數據跟他算長期成本', personality: '不是想跟你算到小數點，是怕你一時開心，接下來三十六期都不開心。', communicationTip: '先拆出每月支出，再比較長期總成本與緊急預備金，讓「買不買」變成「怎麼負擔」。', doList: ['拆解每月支出與長期總成本', '準備可負擔範圍與緊急預備金', '用同一把尺比較不同選項'], avoidList: ['只說「很划算」', '一次丟太多數字，卻沒說結論'] },
  safety: { name: '錦衣衛系・絕對安全控魔王', skill: '「萬一壞掉怎麼辦？」', concern: '他們在意的不是掃興，而是安全、可靠、售後與未知風險。', strategy: '先從官方安全資料、保固與大廠售後系統說起，再談新選擇。', quote: '用保障與實例卸下防備', personality: '嘴上問十次安不安全，心裡其實只想確認：真的出狀況時，你有沒有退路。', communicationTip: '先講保固、售後與安全資訊，再補上遇到意外時的備案，讓未知變得可預期。', doList: ['整理保固與售後服務內容', '用可信資料回答安全疑問', '準備一個實際可行的備案'], avoidList: ['用「你不懂啦」開場', '只強調新科技很方便'] },
  face: { name: '隔壁小明系・愛比較面子魔王', skill: '「哪像你們家孩子在大公司……」', concern: '比較背後，往往是希望你做出一個讓人安心、也能被理解的成熟選擇。', strategy: '別只炫科技；強調品質、長期規劃與成熟決策，會更容易被聽見。', quote: '把選擇說成成熟規劃', personality: '親戚比較雷達常駐，但最在意的，可能還是你有沒有認真想過這個選擇。', communicationTip: '把需求、取捨與長期安排講清楚；不需要贏過誰，只要讓人看見你做過功課。', doList: ['先說自己的需求與考量', '呈現完整、成熟的規劃', '把比較轉成適不適合自己'], avoidList: ['直接拿別人家的孩子比較', '把討論變成輸贏'] },
  tradition: { name: '傳統派・古板不信邪魔王', skill: '「我們吃的鹽比你吃的米多！」', concern: '熟悉的做法帶來安全感，對新科技的保留不代表他們不關心你。', strategy: '用生活化資訊和實際情境，一步一步解釋；先建立熟悉感，不急著丟技術名詞。', quote: '從日常使用開始慢慢說', personality: '熟悉的做法不一定永遠最好；只是每次要更新說明書，他們都會先嘆一口氣。', communicationTip: '從熟悉的生活情境開始，一次說明一件改變；先讓新選項變熟悉，不急著要求認同。', doList: ['從每天會遇到的情境開始', '用操作示範代替一串術語', '一次只討論一個新選項'], avoidList: ['否定他們過去的經驗', '一口氣搬出太多新名詞'] },
} as const

type Dimension = typeof DIMENSIONS[number]
type QuestionRow = {
  id: string
  stage_no: number
  quiz_options: Array<Record<string, unknown>>
}

export function isOptionKey(value: unknown): value is OptionKey {
  return typeof value === 'string' && OPTION_KEYS.includes(value as OptionKey)
}

export async function createQuizSession(participant: Participant, sourceLinkId = participant.source_referral_link_id) {
  const admin = getSupabaseAdmin()
  const { data, error } = await admin.schema('campaign').from('quiz_sessions')
    .insert({ anonymous_session_id: randomUUID(), participant_id: participant.id, source_referral_link_id: sourceLinkId })
    .select('id')
    .single()
  if (error) throw error
  await recordReferralEvent(sourceLinkId, participant.id, data.id, 'STARTED')
  return data.id as string
}

export async function getQuizSession(sessionId: string) {
  const admin = getSupabaseAdmin()
  const { data: session, error: sessionError } = await admin.schema('campaign').from('quiz_sessions')
    .select('id, status').eq('id', sessionId).maybeSingle()
  if (sessionError) throw sessionError
  if (!session) return null

  const { data: answers, error: answersError } = await admin.schema('campaign').from('quiz_answers')
    .select('question_id, selected_option').eq('quiz_session_id', sessionId)
  if (answersError) throw answersError
  return {
    status: session.status as string,
    answers: Object.fromEntries((answers ?? []).map((answer) => [answer.question_id, answer.selected_option as OptionKey])),
  }
}

export async function saveQuizAnswer(sessionId: string, questionId: string, optionId: OptionKey) {
  const admin = getSupabaseAdmin()
  const { data: session, error: sessionError } = await admin.schema('campaign').from('quiz_sessions')
    .select('id, status').eq('id', sessionId).maybeSingle()
  if (sessionError) throw sessionError
  if (!session || session.status !== 'in_progress') return { status: 'invalid_session' as const }

  const { data: option, error: optionError } = await admin.schema('campaign').from('quiz_options')
    .select('id').eq('question_id', questionId).eq('option_key', optionId).maybeSingle()
  if (optionError) throw optionError
  if (!option) return { status: 'invalid_option' as const }

  const { error } = await admin.schema('campaign').from('quiz_answers').upsert(
    { quiz_session_id: sessionId, question_id: questionId, selected_option: optionId },
    { onConflict: 'quiz_session_id,question_id' },
  )
  if (error) throw error
  return { status: 'saved' as const }
}

export async function calculateAndStoreResult(sessionId: string) {
  const admin = getSupabaseAdmin()
  const { data: session, error: sessionError } = await admin.schema('campaign').from('quiz_sessions')
    .select('id, status, participant_id, source_referral_link_id').eq('id', sessionId).maybeSingle()
  if (sessionError) throw sessionError
  if (!session) return { status: 'invalid_session' as const }

  if (session.status === 'completed') {
    const { data: existingResult, error: existingError } = await admin.schema('campaign').from('quiz_results')
      .select('id, defense_value, persona_key, ability_scores_json, result_summary')
      .eq('quiz_session_id', sessionId).maybeSingle()
    if (existingError) throw existingError
    if (existingResult) {
      if (session.participant_id) await recordReferralEvent(session.source_referral_link_id, session.participant_id, sessionId, 'COMPLETED')
      return { status: 'ready' as const, result: existingResult }
    }
  }

  const { data: answers, error: answersError } = await admin.schema('campaign').from('quiz_answers')
    .select('question_id, selected_option').eq('quiz_session_id', sessionId)
  if (answersError) throw answersError
  const answerRows = (answers ?? []) as Array<{ question_id: string; selected_option: string }>
  const answerByQuestion = new Map(answerRows.map((answer) => [answer.question_id, answer.selected_option]))

  const { data: questions, error: questionsError } = await admin.schema('campaign').from('quiz_questions')
    .select('id, stage_no, quiz_options(option_key, money_score, safety_score, face_score, tradition_score)')
    .eq('active', true).order('order_no')
  if (questionsError) throw questionsError
  const activeQuestions = (questions ?? []) as QuestionRow[]
  if (!activeQuestions.length || answerByQuestion.size < activeQuestions.length) {
    return { status: 'incomplete' as const, answered: answerByQuestion.size, required: activeQuestions.length }
  }

  const totals = { money: 0, safety: 0, face: 0, tradition: 0 }
  const stageThree = { money: 0, safety: 0, face: 0, tradition: 0 }
  for (const question of activeQuestions) {
    const selectedOption = answerByQuestion.get(question.id)
    const option = question.quiz_options.find((item) => item.option_key === selectedOption)
    if (!option) return { status: 'incomplete' as const, answered: answerByQuestion.size, required: activeQuestions.length }
    for (const dimension of DIMENSIONS) {
      const score = Number(option[`${dimension}_score`] ?? 0)
      totals[dimension] += score
      if (question.stage_no === 3) stageThree[dimension] += score
    }
  }

  const highest = Math.max(...DIMENSIONS.map((dimension) => totals[dimension]))
  const primary = DIMENSIONS.filter((dimension) => totals[dimension] === highest)
    .sort((left, right) => stageThree[right] - stageThree[left] || TIE_PRIORITY.indexOf(left) - TIE_PRIORITY.indexOf(right))[0]
  const secondary = DIMENSIONS.filter((dimension) => dimension !== primary)
    .sort((left, right) => totals[right] - totals[left] || TIE_PRIORITY.indexOf(left) - TIE_PRIORITY.indexOf(right))[0]
  const defenseValue = Math.min(5, Math.max(1, Math.round((totals[primary] / 33) * 5)))
  const resultSummary = { primary, secondary, profile: { key: primary, ...profiles[primary] } }

  const { data: result, error: resultError } = await admin.schema('campaign').from('quiz_results').upsert(
    { quiz_session_id: sessionId, participant_id: session.participant_id, completed_at: new Date().toISOString(), defense_value: defenseValue, persona_key: primary, ability_scores_json: totals, result_summary: resultSummary },
    { onConflict: 'quiz_session_id' },
  ).select('id, defense_value, persona_key, ability_scores_json, result_summary').single()
  if (resultError) throw resultError

  const { error: completeError } = await admin.schema('campaign').from('quiz_sessions')
    .update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', sessionId)
  if (completeError) throw completeError
  if (session.participant_id) await recordReferralEvent(session.source_referral_link_id, session.participant_id, sessionId, 'COMPLETED')
  return { status: 'ready' as const, result }
}
