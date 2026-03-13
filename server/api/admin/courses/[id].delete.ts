import { serverSupabaseService } from '../../../utils/supabaseServer'
import { requireAdmin } from '../../../utils/requireAdmin'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const id = getRouterParam(event, 'id')
  const supabase = serverSupabaseService()
  const { error } = await supabase.from('courses').delete().eq('id', id!)
  if (error) throw createError({ statusCode: 500, message: error.message })
  return { ok: true }
})
