import { serverSupabaseService } from '../../utils/supabaseServer'
import { hashToken } from '../../utils/tokenHash'
import { hashPassword } from '../../utils/password'
import { checkRateLimit } from '../../utils/rateLimit'
import { PASSWORD_MIN_LENGTH } from '../../utils/validation'

export default defineEventHandler(async (event) => {
  checkRateLimit(event, {
    name: 'reset-password',
    maxRequests: 5,
    windowMs: 15 * 60 * 1000,
    message: 'auth.resetPassword.rateLimited',
  })

  const body = await readBody<{ token?: string; newPassword?: string }>(event)
  const token = body.token
  const newPassword = body.newPassword

  if (!token || !newPassword || newPassword.length < PASSWORD_MIN_LENGTH) {
    throw createError({
      statusCode: 400,
      message: 'auth.resetPassword.missingFields',
    })
  }

  const tokenHash = hashToken(token)
  const supabase = serverSupabaseService()

  const { data: active, error: lookupError } = await supabase.rpc('password_reset_token_active', {
    p_token_hash: tokenHash,
  })

  if (lookupError) {
    console.error('[reset-password]', lookupError.message)
    throw createError({ statusCode: 500, message: 'auth.resetPassword.error' })
  }

  if (active === false) {
    throw createError({ statusCode: 400, message: 'auth.resetPassword.invalidLink' })
  }

  if (active !== true) {
    console.error('[reset-password]', 'password_reset_token_active returned no boolean')
    throw createError({ statusCode: 500, message: 'auth.resetPassword.error' })
  }

  const passwordHash = await hashPassword(newPassword)

  const { data: consumed, error } = await supabase.rpc('consume_password_reset', {
    p_token_hash: tokenHash,
    p_password_hash: passwordHash,
  })

  if (error) {
    console.error('[reset-password]', error.message)
    throw createError({ statusCode: 500, message: 'auth.resetPassword.error' })
  }

  if (consumed === true) {
    return { ok: true }
  }

  if (consumed === false) {
    throw createError({ statusCode: 400, message: 'auth.resetPassword.invalidLink' })
  }

  console.error('[reset-password]', 'consume_password_reset returned no boolean')
  throw createError({ statusCode: 500, message: 'auth.resetPassword.error' })
})
