import { serverSupabaseService } from '../../../utils/supabaseServer'
import { requireAdmin } from '../../../utils/requireAdmin'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const id = getRouterParam(event, 'id')
  const { isAdmin } = await readBody<{ isAdmin: boolean }>(event)
  if (typeof isAdmin !== 'boolean') throw createError({ statusCode: 400, message: 'isAdmin must be boolean' })
  const supabase = serverSupabaseService()
  const { data, error } = await supabase.from('users').update({ isAdmin }).eq('id', id!).select().single()
  if (error) throw createError({ statusCode: 500, message: error.message })
  return data
})
