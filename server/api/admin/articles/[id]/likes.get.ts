import { serverSupabaseService } from '../../../../utils/supabaseServer'
import { requireAdmin } from '../../../../utils/requireAdmin'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Missing id parameter' })
  const supabase = serverSupabaseService()
  const { data, error } = await supabase
    .from('article_likes')
    .select('*, users(name, email, avatar_url)')
    .eq('article_id', id)
    .order('created_at', { ascending: false })
    .limit(500)
  if (error) {
    console.error('[admin/articles/[id]/likes.get]', error.message)
    throw createError({ statusCode: 500, message: 'Database operation failed' })
  }
  return data ?? []
})
