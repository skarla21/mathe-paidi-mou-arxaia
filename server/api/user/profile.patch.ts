import { serverSupabaseService } from '../../utils/supabaseServer'
import { requireAuth } from '../../utils/requireAuth'
import { hashPassword, verifyPassword } from '../../utils/password'

export default defineEventHandler(async (event) => {
  const userId = requireAuth(event)

  type Body = { name?: string | null; currentPassword?: string; newPassword?: string }
  const body = await readBody<Body>(event).catch(() => ({} as Body))

  if (!body || typeof body !== 'object') {
    throw createError({ statusCode: 400, message: 'Invalid body' })
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
      throw createError({ statusCode: 400, message: 'Both currentPassword and newPassword are required' })
    }
    if (typeof body.newPassword !== 'string' || body.newPassword.length < 8) {
      throw createError({ statusCode: 400, message: 'New password must be at least 8 characters' })
    }

    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('password_hash')
      .eq('id', userId)
      .single()

    if (fetchError || !user) {
      throw createError({ statusCode: 500, message: 'Failed to fetch user' })
    }
    if (!user.password_hash) {
      throw createError({ statusCode: 400, message: 'This account uses Google login and has no password' })
    }

    const valid = await verifyPassword(body.currentPassword, user.password_hash)
    if (!valid) {
      throw createError({ statusCode: 400, message: 'Current password is incorrect' })
    }

    updates.password_hash = await hashPassword(body.newPassword)
  }

  if (Object.keys(updates).length === 0) {
    throw createError({ statusCode: 400, message: 'No valid fields to update' })
  }

  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select('id, email, name, avatar_url')
    .single()

  if (error) {
    throw createError({ statusCode: 500, message: error.message })
  }

  return data
})
