import { serverSupabaseService } from '../../utils/supabaseServer'
import { hashPassword } from '../../utils/password'

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
    })
    .select('id')
    .single()

  if (error || !data) {
    throw createError({ statusCode: 500, message: 'Unable to register user' })
  }

  return { ok: true }
})
