import { createHash, randomUUID } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { assertSupabaseDevEnvironment } from './supabase-dev-guard.mjs'

const { url: supabaseUrl, key: serviceKey, projectRef, environment } = assertSupabaseDevEnvironment()
if (environment !== 'hackathon_integration' || process.env.ALLOW_HACKATHON_E2E !== 'true') {
  throw new Error('HACKATHON_E2E_GUARD_BLOCKED: explicit pre-release E2E opt-in is required.')
}

const origin = (process.env.E2E_BASE_URL || 'https://asian-parents-challenge.vercel.app').replace(/\/$/, '')
if (!origin.startsWith('https://')) throw new Error('E2E_BASE_URL must use HTTPS.')

const testRunId = randomUUID()
const sessionIds = new Set()
const resultIds = new Set()
const report = Object.fromEntries([
  'Quiz Start', 'Answer Upsert', 'Resume', 'Previous Answer Update',
  'Result Persistence', 'Share Token', 'Invalid Share', 'LINE Token',
].map((name) => [name, { status: 'FAIL', detail: 'Not reached' }]))
let cleanupStatus = 'PASS'

function pass(name, detail) { report[name] = { status: 'PASS', detail } }
function fail(name, error) { report[name] = { status: 'FAIL', detail: error instanceof Error ? error.message : String(error) } }
function assert(condition, message) { if (!condition) throw new Error(message) }
function isUuid(value) { return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value) }
function sha256(value) { return createHash('sha256').update(value).digest('hex') }
function curlQuote(value) { return `"${String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r?\n/g, '\\n')}"` }

function curlRequest(url, method, headers = {}, body) {
  const config = [
    `url = ${curlQuote(url)}`,
    `request = ${curlQuote(method)}`,
    'silent',
    'show-error',
    'max-time = 30',
    `write-out = ${curlQuote('\\n__HTTP_STATUS__%{http_code}')}`,
    ...Object.entries(headers).map(([name, value]) => `header = ${curlQuote(`${name}: ${value}`)}`),
    ...(body === undefined ? [] : [`data = ${curlQuote(JSON.stringify(body))}`]),
    '',
  ].join('\n')
  const result = spawnSync('curl', ['--config', '-'], { input: config, encoding: 'utf8', maxBuffer: 5 * 1024 * 1024 })
  if (result.error) throw new Error(`curl transport failed: ${result.error.message}`)
  const output = result.stdout || ''
  const markerIndex = output.lastIndexOf('__HTTP_STATUS__')
  if (result.status !== 0 || markerIndex < 0) throw new Error(`curl transport failed: ${result.stderr || 'no HTTP status returned'}`)
  const text = output.slice(0, markerIndex).replace(/\n$/, '')
  const status = Number(output.slice(markerIndex + '__HTTP_STATUS__'.length).trim())
  let data = null
  try { data = text ? JSON.parse(text) : null } catch { data = text }
  return { status, data, text }
}

async function requestApi(path, method = 'GET', body) {
  return curlRequest(`${origin}${path}`, method, body === undefined ? {} : { 'Content-Type': 'application/json' }, body)
}

async function requestDb(path, method = 'GET', body) {
  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    'Accept-Profile': 'campaign',
    'Content-Profile': 'campaign',
    Accept: 'application/json',
    ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    ...(method === 'DELETE' ? { Prefer: 'return=representation' } : {}),
  }
  const response = curlRequest(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/${path}`, method, headers, body)
  if (response.status < 200 || response.status >= 300) throw new Error(`Database ${method} returned HTTP ${response.status}`)
  return response.data
}

async function startSession() {
  const response = await requestApi('/api/quiz/start', 'POST', { quiz_version: 'v1' })
  assert(response.status === 201 && isUuid(response.data?.session_id), `quiz/start returned HTTP ${response.status}`)
  sessionIds.add(response.data.session_id)
  const rows = await requestDb(`quiz_sessions?id=eq.${response.data.session_id}&select=id,status`)
  assert(rows.length === 1 && rows[0].status === 'in_progress', 'new session was not persisted as in_progress')
  return response.data.session_id
}

async function answer(sessionId, questionId, optionId) {
  const response = await requestApi('/api/quiz/answer', 'POST', {
    session_id: sessionId,
    question_id: questionId,
    option_id: optionId,
  })
  assert(response.status === 200 && response.data?.status === 'saved', `${questionId}/${optionId} returned HTTP ${response.status}`)
}

async function sessionAnswers(sessionId) {
  return requestDb(`quiz_answers?quiz_session_id=eq.${sessionId}&select=question_id,selected_option&order=question_id.asc`)
}

async function deriveExpectedScoring(sessionId) {
  const [questions, options, answers] = await Promise.all([
    requestDb('quiz_questions?select=id,stage_no&active=eq.true&order=order_no.asc'),
    requestDb('quiz_options?select=question_id,option_key,money_score,safety_score,face_score,tradition_score'),
    sessionAnswers(sessionId),
  ])
  assert(questions.length === 15 && answers.length === 15, 'expected scoring inputs are incomplete')
  const answerMap = new Map(answers.map((row) => [row.question_id, row.selected_option]))
  const optionMap = new Map(options.map((row) => [`${row.question_id}:${row.option_key}`, row]))
  const dimensions = ['money', 'safety', 'face', 'tradition']
  const tiePriority = ['safety', 'money', 'face', 'tradition']
  const totals = Object.fromEntries(dimensions.map((dimension) => [dimension, 0]))
  const stageThree = Object.fromEntries(dimensions.map((dimension) => [dimension, 0]))
  for (const question of questions) {
    const option = optionMap.get(`${question.id}:${answerMap.get(question.id)}`)
    assert(option, `scoring option missing for ${question.id}`)
    for (const dimension of dimensions) {
      const score = Number(option[`${dimension}_score`] || 0)
      totals[dimension] += score
      if (question.stage_no === 3) stageThree[dimension] += score
    }
  }
  const highest = Math.max(...dimensions.map((dimension) => totals[dimension]))
  const primary = dimensions.filter((dimension) => totals[dimension] === highest)
    .sort((left, right) => stageThree[right] - stageThree[left] || tiePriority.indexOf(left) - tiePriority.indexOf(right))[0]
  return { totals, primary, defense: Math.min(5, Math.max(1, Math.round((totals[primary] / 33) * 5))) }
}

function idsFilter(ids) {
  const safeIds = [...ids].filter(isUuid)
  assert(safeIds.length === ids.size, 'refusing cleanup with an unverified identifier')
  return `in.(${safeIds.join(',')})`
}

async function cleanup() {
  const sessionFilter = idsFilter(sessionIds)
  if (!sessionIds.size) return

  // Resolve child rows only through this run's session IDs, then delete exact IDs.
  const resultRows = await requestDb(`quiz_results?quiz_session_id=${sessionFilter}&select=id`)
  for (const row of resultRows) if (isUuid(row.id)) resultIds.add(row.id)
  const resultFilter = idsFilter(resultIds)
  const shareRows = resultIds.size ? await requestDb(`share_results?quiz_result_id=${resultFilter}&select=id`) : []
  const linkRows = resultIds.size ? await requestDb(`link_tokens?quiz_result_id=${resultFilter}&select=id`) : []
  const shareIds = new Set(shareRows.map((row) => row.id).filter(isUuid))
  const linkIds = new Set(linkRows.map((row) => row.id).filter(isUuid))

  const deletes = [
    ['link_tokens', linkIds],
    ['share_results', shareIds],
    ['quiz_results', resultIds],
  ]
  for (const [table, ids] of deletes) {
    if (ids.size) await requestDb(`${table}?id=${idsFilter(ids)}`, 'DELETE')
  }
  await requestDb(`quiz_answers?quiz_session_id=${sessionFilter}`, 'DELETE')
  await requestDb(`quiz_sessions?id=${sessionFilter}`, 'DELETE')

  const leftovers = await Promise.all([
    requestDb(`quiz_sessions?id=${sessionFilter}&select=id`),
    requestDb(`quiz_answers?quiz_session_id=${sessionFilter}&select=question_id`),
    resultIds.size ? requestDb(`quiz_results?id=${resultFilter}&select=id`) : Promise.resolve([]),
    shareIds.size ? requestDb(`share_results?id=${idsFilter(shareIds)}&select=id`) : Promise.resolve([]),
    linkIds.size ? requestDb(`link_tokens?id=${idsFilter(linkIds)}&select=id`) : Promise.resolve([]),
  ])
  assert(leftovers.every((rows) => rows.length === 0), 'one or more test-run rows remain after exact cleanup')
}

try {
  const health = await requestApi('/api/health')
  assert(health.status === 200 && health.data?.status === 'ok', 'API health check failed')

  const resumeSessionId = await startSession()
  pass('Quiz Start', 'Unauthenticated API created a persisted in_progress session.')

  await answer(resumeSessionId, 'q01', 'A')
  await answer(resumeSessionId, 'q01', 'C')
  let rows = await sessionAnswers(resumeSessionId)
  assert(rows.filter((row) => row.question_id === 'q01').length === 1, 'q01 upsert created duplicate rows')
  assert(rows.find((row) => row.question_id === 'q01')?.selected_option === 'C', 'q01 latest answer is not C')
  pass('Answer Upsert', 'A then C leaves one q01 answer row with C selected.')

  for (const [questionId, optionId] of [['q02', 'B'], ['q03', 'A'], ['q04', 'C'], ['q05', 'A']]) {
    await answer(resumeSessionId, questionId, optionId)
  }
  const resumed = await requestApi(`/api/quiz/session?session_id=${encodeURIComponent(resumeSessionId)}`)
  assert(resumed.status === 200 && resumed.data?.status === 'in_progress', 'resume endpoint did not return in_progress')
  assert(Object.keys(resumed.data.answers || {}).length === 5, 'resume did not restore exactly five answered questions')
  assert(resumed.data.answers.q01 === 'C' && resumed.data.answers.q05 === 'A', 'resume returned stale answers')
  const sameSession = await requestDb(`quiz_sessions?id=eq.${resumeSessionId}&select=id,status`)
  assert(sameSession.length === 1 && sameSession[0].id === resumeSessionId, 'resume changed or duplicated the session')
  pass('Resume', 'GET session restored q01–q05 in the original session; next unanswered item is q06.')

  const fullSessionId = await startSession()
  for (let number = 1; number <= 15; number += 1) {
    const qid = `q${String(number).padStart(2, '0')}`
    const option = number === 5 ? 'A' : ['A', 'B', 'C'][(number - 1) % 3]
    await answer(fullSessionId, qid, option)
    if (number === 5) await answer(fullSessionId, qid, 'C')
  }
  rows = await sessionAnswers(fullSessionId)
  assert(rows.length === 15, `full quiz persisted ${rows.length} answers instead of 15`)
  assert(rows.filter((row) => row.question_id === 'q05').length === 1, 'previous-answer update duplicated q05')
  assert(rows.find((row) => row.question_id === 'q05')?.selected_option === 'C', 'previous-answer update did not persist q05=C')
  pass('Previous Answer Update', 'q05 changed A → C in place; all 15 answers are present once.')

  const expected = await deriveExpectedScoring(fullSessionId)
  const firstResult = await requestApi('/api/quiz/result', 'POST', { session_id: fullSessionId })
  assert(firstResult.status === 200 && firstResult.data?.result?.id, `result API returned HTTP ${firstResult.status}`)
  const result = firstResult.data.result
  assert(result.persona_key === expected.primary, 'server result does not match scoring recomputed from stored answers')
  assert(['money', 'safety', 'face', 'tradition'].every((dimension) => Number(result.ability_scores_json?.[dimension]) === expected.totals[dimension]), 'persisted scores do not match current DB answer weights')
  assert(result.defense_value === expected.defense, 'persisted defense value does not match server scoring inputs')
  const persisted = await requestDb(`quiz_results?quiz_session_id=eq.${fullSessionId}&select=id,persona_key,ability_scores_json,defense_value`)
  assert(persisted.length === 1 && persisted[0].id === result.id, 'result was not persisted exactly once')
  resultIds.add(result.id)
  const secondResult = await requestApi('/api/quiz/result', 'POST', { session_id: fullSessionId })
  assert(secondResult.status === 200, `repeat result request returned HTTP ${secondResult.status}`)
  const stableFields = (value) => ({ id: value.id, persona_key: value.persona_key, scores: value.ability_scores_json, defense: value.defense_value })
  assert(JSON.stringify(stableFields(secondResult.data.result)) === JSON.stringify(stableFields(result)), 'repeated result changed persisted outcome')
  assert(['MONEY', 'SAFETY', 'FACE', 'TRADITION'].includes(String(result.persona_key).toUpperCase()), 'result persona is outside the four supported dimensions')
  pass('Result Persistence', `Server result persisted once and repeated deterministically (${String(result.persona_key).toUpperCase()}).`)

  const createdShare = await requestApi('/api/share', 'POST', { quiz_result_id: result.id })
  assert(createdShare.status === 201 && /^[A-Za-z0-9_-]{43}$/.test(createdShare.data?.share_token || ''), `share API returned HTTP ${createdShare.status}`)
  const shareToken = createdShare.data.share_token
  assert(shareToken !== result.id && shareToken !== fullSessionId, 'share token exposes a database identifier')
  const shareRows = await requestDb(`share_results?quiz_result_id=eq.${result.id}&select=id,share_token_hash,created_at,expires_at`)
  assert(shareRows.length === 1, 'share token was not persisted exactly once')
  const shareRow = shareRows[0]
  assert(shareRow.share_token_hash === sha256(shareToken), 'share raw token/hash relationship is invalid')
  const shareTtlDays = (Date.parse(shareRow.expires_at) - Date.parse(shareRow.created_at)) / 86_400_000
  assert(shareTtlDays >= 29.998 && shareTtlDays <= 30.002, 'share token expiry is not approximately 30 days')
  const publicShare = await requestApi(`/api/share/${encodeURIComponent(shareToken)}`)
  assert(publicShare.status === 200 && publicShare.data?.result, 'public share endpoint did not return result')
  assert(!('id' in publicShare.data.result), 'public response exposes result primary key')
  const publicPayload = JSON.stringify(publicShare.data)
  assert(!publicPayload.includes(result.id) && !publicPayload.includes(fullSessionId), 'public response exposes result or session id')
  pass('Share Token', 'Random token persisted as hash, expires in 30 days, and public response omits internal IDs.')

  const invalidShare = await requestApi('/api/share/not-a-valid-share-token')
  assert(invalidShare.status === 404, `invalid share returned HTTP ${invalidShare.status}`)
  const invalidText = JSON.stringify(invalidShare.data)
  assert(!/sql|supabase|stack|database|primary key/i.test(invalidText), 'invalid share response exposes internal diagnostics')
  pass('Invalid Share', 'Invalid token returns a sanitized 404 response.')

  const createdLine = await requestApi('/api/line-handoff', 'POST', { quiz_result_id: result.id })
  assert(createdLine.status === 201 && /^[A-Za-z0-9_-]{43}$/.test(createdLine.data?.token || ''), `LINE handoff API returned HTTP ${createdLine.status}`)
  const lineToken = createdLine.data.token
  assert(lineToken !== result.id && lineToken !== fullSessionId, 'LINE token exposes a database identifier')
  const lineRows = await requestDb(`link_tokens?quiz_result_id=eq.${result.id}&select=id,token_hash,status,created_at,expires_at,consumed_at`)
  assert(lineRows.length === 1, 'LINE token was not persisted exactly once')
  const lineRow = lineRows[0]
  assert(lineRow.token_hash === sha256(lineToken), 'LINE raw token/hash relationship is invalid')
  const lineTtlMinutes = (Date.parse(lineRow.expires_at) - Date.parse(lineRow.created_at)) / 60_000
  assert(lineTtlMinutes >= 14.9 && lineTtlMinutes <= 15.1, 'LINE token expiry is not approximately 15 minutes')
  assert(lineRow.status === 'active' && lineRow.consumed_at === null, 'LINE token state cannot represent unused single-use token')
  pass('LINE Token', 'Random token is hashed, expires in 15 minutes, and DB status fields support single-use consumption.')
} catch (error) {
  const pending = Object.keys(report).find((name) => report[name].detail === 'Not reached')
  if (pending) fail(pending, error)
  else console.error('E2E encountered an error after the last completed check:', error instanceof Error ? error.message : String(error))
} finally {
  try {
    await cleanup()
  } catch (error) {
    cleanupStatus = 'FAIL'
    console.error('Exact test-run cleanup failed:', error instanceof Error ? error.message : String(error))
  }
  const failed = Object.values(report).some((item) => item.status !== 'PASS') || cleanupStatus !== 'PASS'
  console.log(JSON.stringify({
    report: Object.fromEntries(Object.entries(report).map(([name, value]) => [name, value.status])),
    details: Object.fromEntries(Object.entries(report).map(([name, value]) => [name, value.detail])),
    cleanup: cleanupStatus,
    unrelated_data_modified: 'NO',
    test_run_id: testRunId,
    tracked_session_count: sessionIds.size,
    tracked_result_count: resultIds.size,
    project_ref: projectRef,
    environment,
    api_origin: origin,
  }, null, 2))
  if (failed) process.exitCode = 1
}
