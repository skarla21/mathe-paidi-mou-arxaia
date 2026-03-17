import { randomBytes } from 'node:crypto'
import { serverSupabaseService } from '../../utils/supabaseServer'
import { hashToken } from '../../utils/tokenHash'
import { sendVerificationEmail } from '../../utils/email'
import { requireAuth } from '../../utils/requireAuth'

const RESEND_COOLDOWN_MS = 60_000

export default defineEventHandler(async (event) => {
  const userId = requireAuth(event)
  const supabase = serverSupabaseService()

  const { data: user } = await supabase
    .from('users')
    .select('email, email_verified')
    .eq('id', userId)
    .single()

  if (!user?.email) {
    throw createError({ statusCode: 404, message: 'User not found' })
  }
  if (user.email_verified) {
    throw createError({ statusCode: 400, message: 'Email already verified' })
  }

  const { data: recent } = await supabase
    .from('verification_tokens')
    .select('created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (recent) {
    const elapsed = Date.now() - new Date(recent.created_at).getTime()
    if (elapsed < RESEND_COOLDOWN_MS) {
      throw createError({
        statusCode: 429,
        message: 'Please wait before requesting another verification email',
      })
    }
  }

  await supabase.from('verification_tokens').delete().eq('user_id', userId)

  const rawToken = randomBytes(32).toString('hex')
  const tokenHash = hashToken(rawToken)
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

  await supabase.from('verification_tokens').insert({
    user_id: userId,
    token_hash: tokenHash,
    expires_at: expiresAt,
  })

  const baseUrl = getRequestURL(event).origin
  const verifyLink = `${baseUrl}/api/auth/verify-email?token=${rawToken}`

  await sendVerificationEmail(user.email, verifyLink)

  return { ok: true }
})
