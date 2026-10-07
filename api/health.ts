import type { VercelRequest, VercelResponse } from '@vercel/node'
import { methodNotAllowed, serverError } from './_lib/http.js'
import { validateServerEnv } from './_lib/supabase-admin.js'

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'GET') return methodNotAllowed(response, ['GET'])
  try {
    validateServerEnv()
    const baseUrl = process.env.SUPABASE_URL!.replace(/\/$/, '')
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabaseResponse = await fetch(`${baseUrl}/rest/v1/quiz_sessions?select=id&limit=1`, {
      method: 'HEAD',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Accept-Profile': 'campaign',
      },
    })
    if (!supabaseResponse.ok) {
      const details = await supabaseResponse.text()
      console.error('Supabase health query rejected', { status: supabaseResponse.status, details })
      throw new Error(`Supabase health query returned ${supabaseResponse.status}`)
    }
    return response.status(200).json({ status: 'ok' })
  } catch (error) {
    return serverError(response, error)
  }
}
