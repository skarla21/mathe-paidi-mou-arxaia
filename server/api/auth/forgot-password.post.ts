import { randomBytes } from 'node:crypto'
import { serverSupabaseService } from '../../utils/supabaseServer'
import { hashToken } from '../../utils/tokenHash'
import { sendPasswordResetEmail } from '../../utils/email'
import { checkRateLimit } from '../../utils/rateLimit'
import { EMAIL_REGEX } from '../../utils/validation'

export default defineEventHandler(async (event) => {
  checkRateLimit(event, { name: 'forgot-password', maxRequests: 3, windowMs: 15 * 60 * 1000 })

  const body = await readBody<{ email?: string }>(event)
  const email = body.email?.toLowerCase().trim()

  if (!email || !EMAIL_REGEX.test(email)) {
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
