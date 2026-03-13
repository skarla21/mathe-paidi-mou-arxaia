import { serverSupabaseService } from '../../utils/supabaseServer'
import { hashPassword } from '../../utils/password'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ email?: string; password?: string }>(event)

  if (!body.email || !body.password) {
    throw createError({ statusCode: 400, message: 'Email and password are required' })
  }

  const email = body.email.toLowerCase().trim()

  const supabase = serverSupabaseService()

  const { data: existing } = await supabase.from('users').select('id').eq('email', email).maybeSingle()
  if (existing) {
    return { error: 'Email already registered' }
  }

  const passwordHash = await hashPassword(body.password)

  const { data, error } = await supabase
    .from('users')
    .insert({
      email,
      password_hash: passwordHash,
    })
    .select('id')
    .single()

  if (error || !data) {
    throw createError({ statusCode: 500, message: 'Unable to register user' })
  }

  return { ok: true }
})

