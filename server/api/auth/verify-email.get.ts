import { serverSupabaseService } from '../../utils/supabaseServer'
import { hashToken } from '../../utils/tokenHash'

export default defineEventHandler(async (event) => {
  const token = getQuery(event).token as string | undefined
  if (!token || typeof token !== 'string') {
    return sendRedirect(event, '/?emailVerification=invalid_token', 302)
  }

  const tokenHash = hashToken(token)
  const supabase = serverSupabaseService()

  const { data: consumed, error } = await supabase.rpc('consume_verification_token', {
    p_token_hash: tokenHash,
  })

  if (error) {
    console.error('[verify-email]', error.message)
    return sendRedirect(event, '/?emailVerification=unavailable', 302)
  }

  if (consumed === true) {
    return sendRedirect(event, '/?emailVerification=ok', 302)
  }

  if (consumed === false) {
    return sendRedirect(event, '/?emailVerification=expired_token', 302)
  }

  console.error('[verify-email]', 'consume_verification_token returned no boolean')
  return sendRedirect(event, '/?emailVerification=unavailable', 302)
})
