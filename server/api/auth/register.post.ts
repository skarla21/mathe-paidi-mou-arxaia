import { randomBytes } from 'node:crypto'
import { serverSupabaseService } from '../../utils/supabaseServer'
import { hashPassword } from '../../utils/password'
import { hashToken } from '../../utils/tokenHash'
import { sendVerificationEmail } from '../../utils/email'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ email?: string; password?: string; name?: string }>(event)

  const name = body.name?.trim() ?? ''
  if (!body.email || !body.password || name.length < 2) {
    throw createError({ statusCode: 400, message: 'Email, password and name (min 2 chars) are required' })
  }

  if (body.password.length < 6) {
    throw createError({ statusCode: 400, message: 'Password must be at least 6 characters' })
  }

  const email = body.email.toLowerCase().trim()

  const supabase = serverSupabaseService()

  const { data: existing } = await supabase.from('users').select('id').eq('email', email).maybeSingle()
  if (existing) {
    throw createError({ statusCode: 409, message: 'EMAIL_TAKEN' })
  }

  const password = body.password
  const passwordHash = await hashPassword(password)

  const { data, error } = await supabase
    .from('users')
    .insert({
      email,
      password_hash: passwordHash,
      name,
      email_verified: false,
    })
    .select('id')
    .single()

  if (error || !data) {
    throw createError({ statusCode: 500, message: 'Unable to register user' })
  }

  const rawToken = randomBytes(32).toString('hex')
  const tokenHash = hashToken(rawToken)
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

  await supabase.from('verification_tokens').insert({
    user_id: data.id,
    token_hash: tokenHash,
    expires_at: expiresAt,
  })

  const baseUrl = getRequestURL(event).origin
  const verifyLink = `${baseUrl}/api/auth/verify-email?token=${rawToken}`

  try {
    await sendVerificationEmail(email, verifyLink)
  } catch (e) {
    console.error('[register] Failed to send verification email:', e)
  }

  return { ok: true }
})
