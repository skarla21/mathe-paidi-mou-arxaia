import { serverSupabaseService } from '../../utils/supabaseServer'
import { requireAuth } from '../../utils/requireAuth'
import { hashPassword, verifyPassword } from '../../utils/password'
import { PASSWORD_MIN_LENGTH } from '../../utils/validation'

export default defineEventHandler(async (event) => {
  const userId = requireAuth(event)

  type Body = { name?: string | null; currentPassword?: string; newPassword?: string }
  const body = await readBody<Body>(event).catch(() => ({} as Body))

  if (!body || typeof body !== 'object') {
    throw createError({ statusCode: 400, message: 'Μη έγκυρα στοιχεία' })
  }

  const supabase = serverSupabaseService()
  const updates: { name?: string | null; password_hash?: string } = {}

  // Name update
  if (typeof body.name === 'string') {
    updates.name = body.name.trim() || null
  }

  // Password change
  if (body.currentPassword !== undefined || body.newPassword !== undefined) {
    if (!body.currentPassword || !body.newPassword) {
      throw createError({ statusCode: 400, message: 'Απαιτούνται ο τρέχων και ο νέος κωδικός' })
    }
    if (typeof body.newPassword !== 'string' || body.newPassword.length < PASSWORD_MIN_LENGTH) {
      throw createError({ statusCode: 400, message: 'Ο κωδικός πρέπει να έχει τουλάχιστον 8 χαρακτήρες' })
    }

    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('password_hash')
      .eq('id', userId)
      .single()

    if (fetchError || !user) {
      throw createError({ statusCode: 500, message: 'Κάτι πήγε στραβά' })
    }
    if (!user.password_hash) {
      throw createError({ statusCode: 400, message: 'Αυτός ο λογαριασμός συνδέεται με Google και δεν έχει κωδικό' })
    }

    const valid = await verifyPassword(body.currentPassword, user.password_hash)
    if (!valid) {
      throw createError({ statusCode: 400, message: 'Λάθος τρέχων κωδικός' })
    }

    updates.password_hash = await hashPassword(body.newPassword)
  }

  if (Object.keys(updates).length === 0) {
    throw createError({ statusCode: 400, message: 'Δεν υπάρχει κάτι για ενημέρωση' })
  }

  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select('id, email, name, avatar_url')
    .single()

  if (error) {
    console.error('[user/profile.patch]', error.message)
    throw createError({ statusCode: 500, message: 'Κάτι πήγε στραβά' })
  }

  return data
})
