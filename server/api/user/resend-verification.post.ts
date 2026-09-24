import { randomBytes } from 'node:crypto'
import { serverSupabaseService } from '../../utils/supabaseServer'
import { hashToken } from '../../utils/tokenHash'
import { deleteIssuedToken } from '../../utils/deleteIssuedToken'
import { sendVerificationEmail } from '../../utils/email'
import { requireAuth } from '../../utils/requireAuth'
import { checkRateLimit } from '../../utils/rateLimit'

export default defineEventHandler(async (event) => {
  checkRateLimit(event, {
    name: 'resend-verification',
    maxRequests: 5,
    windowMs: 60 * 60 * 1000,
    message: 'auth.verification.rateLimited',
  })

  const userId = requireAuth(event)
  const supabase = serverSupabaseService()

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('email, email_verified')
    .eq('id', userId)
    .single()

  if (userError && userError.code !== 'PGRST116') {
    console.error('[resend-verification]', userError.message)
    throw createError({ statusCode: 500, message: 'auth.verification.resendError' })
  }

  if (!user?.email) {
    throw createError({ statusCode: 404, message: 'auth.verification.userNotFound' })
  }
  if (user.email_verified) {
    throw createError({ statusCode: 400, message: 'auth.verification.verified' })
  }

  const rawToken = randomBytes(32).toString('hex')
  const tokenHash = hashToken(rawToken)
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

  const { data: issued, error: tokenError } = await supabase.rpc('issue_verification_token', {
    p_user_id: userId,
    p_token_hash: tokenHash,
    p_expires_at: expiresAt,
    p_cooldown_seconds: 60,
  })

  if (tokenError) {
    console.error('[resend-verification]', tokenError.message)
    throw createError({ statusCode: 500, message: 'auth.verification.resendError' })
  }

  if (issued === false) {
    throw createError({
      statusCode: 429,
      message: 'auth.verification.resendCooldown',
    })
  }

  if (issued !== true) {
    console.error('[resend-verification]', 'issue_verification_token returned no boolean')
    throw createError({ statusCode: 500, message: 'auth.verification.resendError' })
  }

  const baseUrl = getRequestURL(event).origin
  const verifyLink = `${baseUrl}/api/auth/verify-email?token=${rawToken}`

  try {
    await sendVerificationEmail(user.email, verifyLink)
  } catch (e) {
    console.error('[resend-verification]', e)
    await deleteIssuedToken(supabase, 'verification_tokens', tokenHash, '[resend-verification]')
    throw createError({ statusCode: 500, message: 'auth.verification.resendError' })
  }

  return { ok: true }
})
