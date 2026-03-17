import { serverSupabaseService } from '../../utils/supabaseServer'
import { hashToken } from '../../utils/tokenHash'

export default defineEventHandler(async (event) => {
  const token = getQuery(event).token as string | undefined
  if (!token || typeof token !== 'string') {
    return sendRedirect(event, '/profile/edit?error=invalid_token', 302)
  }

  const tokenHash = hashToken(token)
  const supabase = serverSupabaseService()

  const { data: row } = await supabase
    .from('verification_tokens')
    .select('user_id')
    .eq('token_hash', tokenHash)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  if (!row) {
    return sendRedirect(event, '/profile/edit?error=expired_token', 302)
  }

  await supabase.from('users').update({ email_verified: true }).eq('id', row.user_id)
  await supabase.from('verification_tokens').delete().eq('token_hash', tokenHash)

  return sendRedirect(event, '/profile/edit?verified=1', 302)
})
