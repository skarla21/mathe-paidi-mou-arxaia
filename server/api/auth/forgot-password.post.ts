import { randomBytes } from 'node:crypto'
import { serverSupabaseService } from '../../utils/supabaseServer'
import { hashToken } from '../../utils/tokenHash'
import { sendPasswordResetEmail } from '../../utils/email'

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000
const RATE_LIMIT_MAX = 5

const rateLimitMap = new Map<
  string,
  { count: number; resetAt: number }
>()

function getClientIp(event: { node?: { req?: { headers?: Record<string, string | string[] | undefined>; socket?: { remoteAddress?: string } } } }): string {
  const forwarded = event.node?.req?.headers?.['x-forwarded-for']
  if (forwarded) {
    const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded
    const first = raw?.split(',')[0]?.trim()
    if (first) return first
  }
  return event.node?.req?.socket?.remoteAddress ?? 'unknown'
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now()

  for (const [key, val] of rateLimitMap.entries()) {
    if (now >= val.resetAt) rateLimitMap.delete(key)
  }

  const entry = rateLimitMap.get(ip)

  if (!entry) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return true
  }

  if (now >= entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return true
  }

  entry.count += 1
  return entry.count <= RATE_LIMIT_MAX
}

export default defineEventHandler(async (event) => {
  const ip = getClientIp(event)
  if (!checkRateLimit(ip)) {
    throw createError({
      statusCode: 429,
      message: 'auth.forgotPassword.rateLimited',
      data: { message: 'auth.forgotPassword.rateLimited' },
    })
  }

  const body = await readBody<{ email?: string }>(event)
  const email = body.email?.toLowerCase().trim()

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw createError({ statusCode: 400, message: 'Valid email is required' })
  }

  const supabase = serverSupabaseService()
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .eq('provider', 'credentials')
    .maybeSingle()

  if (user) {
    const rawToken = randomBytes(32).toString('hex')
    const tokenHash = hashToken(rawToken)
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()

    await supabase.from('password_reset_tokens').insert({
      user_id: user.id,
      token_hash: tokenHash,
      expires_at: expiresAt,
    })

    const baseUrl = getRequestURL(event).origin
    const resetLink = `${baseUrl}/reset-password?token=${rawToken}`

    void sendPasswordResetEmail(email, resetLink).catch((e) =>
      console.error('[forgot-password]', e)
    )
  }

  return { ok: true }
})
