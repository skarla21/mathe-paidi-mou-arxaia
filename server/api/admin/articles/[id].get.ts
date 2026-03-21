import { serverSupabaseService } from '../../../utils/supabaseServer'
import { requireAdmin } from '../../../utils/requireAdmin'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Missing id parameter' })
  const supabase = serverSupabaseService()
  const { data, error } = await supabase.from('articles').select('*').eq('id', id).maybeSingle()
  if (error) {
    console.error('[admin/articles/[id].get]', error.message)
    throw createError({ statusCode: 500, message: 'Database operation failed' })
  }
  if (!data) throw createError({ statusCode: 404, message: 'Not found' })
  return data
})
