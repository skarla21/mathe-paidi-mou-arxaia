import { serverSupabaseService } from '../../utils/supabaseServer'
import { hashToken } from '../../utils/tokenHash'
import { hashPassword } from '../../utils/password'
import { PASSWORD_MIN_LENGTH } from '../../utils/validation'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ token?: string; newPassword?: string }>(event)
  const token = body.token
  const newPassword = body.newPassword

  if (!token || !newPassword || newPassword.length < PASSWORD_MIN_LENGTH) {
    throw createError({
      statusCode: 400,
      message: 'Token and password (min 8 chars) are required',
    })
  }

  const tokenHash = hashToken(token)
  const supabase = serverSupabaseService()

  const { data: row } = await supabase
    .from('password_reset_tokens')
    .select('user_id')
    .eq('token_hash', tokenHash)
    .gt('expires_at', new Date().toISOString())
    .is('used_at', null)
    .maybeSingle()

  if (!row) {
    throw createError({ statusCode: 400, message: 'Invalid or expired link' })
  }

  const passwordHash = await hashPassword(newPassword)
  await supabase.from('users').update({ password_hash: passwordHash }).eq('id', row.user_id)

  // Invalidate ALL unused reset tokens for this user (prevents token reuse)
  await supabase
    .from('password_reset_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('user_id', row.user_id)
    .is('used_at', null)

  return { ok: true }
})
