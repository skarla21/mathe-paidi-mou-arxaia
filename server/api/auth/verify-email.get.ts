import { serverSupabaseService } from '../../utils/supabaseServer'
import { hashToken } from '../../utils/tokenHash'

export default defineEventHandler(async (event) => {
  const token = getQuery(event).token as string | undefined
  if (!token || typeof token !== 'string') {
    return sendRedirect(event, '/profile/edit?error=invalid_token', 302)
  }

  const tokenHash = hashToken(token)
  const supabase = serverSupabaseService()

  const { data: consumed, error } = await supabase.rpc('consume_verification_token', {
    p_token_hash: tokenHash,
  })

  if (error) {
    console.error('[verify-email]', error.message)
    return sendRedirect(event, '/profile/edit?error=unavailable', 302)
  }

  if (consumed === true) {
    return sendRedirect(event, '/profile/edit?verified=1', 302)
  }

  if (consumed === false) {
    return sendRedirect(event, '/profile/edit?error=expired_token', 302)
  }

  console.error('[verify-email]', 'consume_verification_token returned no boolean')
  return sendRedirect(event, '/profile/edit?error=unavailable', 302)
})
