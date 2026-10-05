import { randomBytes } from 'node:crypto'
import { serverSupabaseService } from '../../utils/supabaseServer'
import { hashToken } from '../../utils/tokenHash'
import { deleteIssuedToken } from '../../utils/deleteIssuedToken'
import { sendPasswordResetEmail } from '../../utils/email'
import { checkRateLimit } from '../../utils/rateLimit'
import { EMAIL_REGEX } from '../../utils/validation'

export default defineEventHandler(async (event) => {
  checkRateLimit(event, {
    name: 'forgot-password',
    maxRequests: 3,
    windowMs: 15 * 60 * 1000,
    message: 'Πάρα πολλές αιτήσεις. Παρακαλώ δοκίμασε ξανά αργότερα.',
  })

  const body = await readBody<{ email?: string }>(event)
  const email = body.email?.toLowerCase().trim()

  if (!email || !EMAIL_REGEX.test(email)) {
    throw createError({ statusCode: 400, message: 'Παρακαλώ εισάγετε έγκυρο email' })
  }

  const supabase = serverSupabaseService()

  const { data: user, error: lookupError } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .eq('provider', 'credentials')
    .maybeSingle()

  if (lookupError) {
    console.error('[forgot-password]', lookupError.message)
    throw createError({ statusCode: 500, message: 'Δεν ήταν δυνατή η αποστολή του email επαναφοράς. Παρακαλώ δοκίμασε ξανά.' })
  }

  if (user) {
    const rawToken = randomBytes(32).toString('hex')
    const tokenHash = hashToken(rawToken)
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()

    const { data: issued, error } = await supabase.rpc('issue_password_reset_token', {
      p_user_id: user.id,
      p_token_hash: tokenHash,
      p_expires_at: expiresAt,
      p_cooldown_seconds: 300,
      p_lease_seconds: 120,
    })

    if (error) {
      console.error('[forgot-password]', error.message)
      throw createError({ statusCode: 500, message: 'Δεν ήταν δυνατή η αποστολή του email επαναφοράς. Παρακαλώ δοκίμασε ξανά.' })
    }

    if (issued === 'busy') {
      console.error('[forgot-password]', 'reset send already in flight')
      throw createError({ statusCode: 500, message: 'Δεν ήταν δυνατή η αποστολή του email επαναφοράς. Παρακαλώ δοκίμασε ξανά.' })
    }

    if (issued === 'issued') {
      const baseUrl = getRequestURL(event).origin
      const resetLink = `${baseUrl}/reset-password?token=${rawToken}`
      try {
        await sendPasswordResetEmail(email, resetLink)
      } catch (e) {
        console.error('[forgot-password]', e)
        await deleteIssuedToken(supabase, 'password_reset_tokens', tokenHash, '[forgot-password]')
        throw createError({ statusCode: 500, message: 'Δεν ήταν δυνατή η αποστολή του email επαναφοράς. Παρακαλώ δοκίμασε ξανά.' })
      }

      let marked = false
      let markMessage = 'mark_password_reset_sent missed the row'
      for (let attempt = 0; attempt < 2 && !marked; attempt++) {
        const { data, error: markError } = await supabase.rpc('mark_password_reset_sent', {
          p_token_hash: tokenHash,
        })
        marked = data === true
        if (markError) markMessage = markError.message
      }

      if (!marked) {
        console.error('[forgot-password]', markMessage)
        throw createError({ statusCode: 500, message: 'Το email επαναφοράς στάλθηκε, αλλά δεν μπορέσαμε να το επιβεβαιώσουμε. Αν δεν φτάσει, περίμενε λίγα λεπτά και δοκίμασε ξανά.' })
      }
    } else if (issued !== 'cooldown') {
      console.error('[forgot-password]', 'issue_password_reset_token returned an unexpected status')
      throw createError({ statusCode: 500, message: 'Δεν ήταν δυνατή η αποστολή του email επαναφοράς. Παρακαλώ δοκίμασε ξανά.' })
    }
  }

  return { ok: true }
})
