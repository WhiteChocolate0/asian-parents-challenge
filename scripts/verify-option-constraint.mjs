import { randomUUID } from 'node:crypto'
import { assertSupabaseDevEnvironment } from './supabase-dev-guard.mjs'

const { url, key } = assertSupabaseDevEnvironment()
const testRunId = randomUUID()
let testAnswerIndex = 0

const sessionIds = []

async function request(path, options = {}) {
  const response = await fetch(`${url.replace(/\/$/, '')}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Profile': 'campaign',
      Accept: 'application/json',
      ...(options.headers ?? {}),
    },
  })
  const text = await response.text()
  let body = null
  try { body = text ? JSON.parse(text) : null } catch { body = text }
  return { response, body }
}

async function createSession() {
  const { response, body } = await request('quiz_sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify({ anonymous_session_id: randomUUID() }),
  })
  if (!response.ok || !Array.isArray(body) || !body[0]?.id) throw new Error(`Unable to create test session: ${JSON.stringify(body)}`)
  sessionIds.push(body[0].id)
  return body[0].id
}

async function expectInsert(option, expectedErrorCode) {
  const sessionId = await createSession()
  const { response, body } = await request('quiz_answers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      quiz_session_id: sessionId,
      question_id: `__test_${testRunId}_option_constraint_${++testAnswerIndex}__`,
      selected_option: option,
    }),
  })
  if (expectedErrorCode) {
    if (response.ok || body?.code !== expectedErrorCode) throw new Error(`Expected ${expectedErrorCode} for ${String(option)}, received ${body?.code ?? 'success'}`)
    return 'rejected'
  }
  if (!response.ok) throw new Error(`Expected ${String(option)} to be accepted: ${JSON.stringify(body)}`)
  return 'accepted'
}

try {
  const results = {
    A: await expectInsert('A'),
    B: await expectInsert('B'),
    C: await expectInsert('C'),
    D: await expectInsert('D', '23514'),
    null: await expectInsert(null, '23502'),
  }
  console.log(JSON.stringify({ test_run_id: testRunId, results }))
} finally {
  if (sessionIds.length) {
    const filter = `id=in.(${sessionIds.join(',')})`
    const { response, body } = await request(`quiz_sessions?${filter}`, { method: 'DELETE' })
    if (!response.ok) console.error('Test cleanup failed', JSON.stringify(body))
  }
}
