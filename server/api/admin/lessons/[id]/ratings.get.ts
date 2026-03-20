import { serverSupabaseService } from '../../../../utils/supabaseServer'
import { requireAdmin } from '../../../../utils/requireAdmin'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Missing id parameter' })
  const supabase = serverSupabaseService()
  const { data, error } = await supabase
    .from('lesson_ratings').select('*, users(name, email, avatar_url)').eq('lesson_id', id).order('created_at', { ascending: false }).limit(100)
  if (error) throw createError({ statusCode: 500, message: 'Database operation failed' })
  return data ?? []
})
