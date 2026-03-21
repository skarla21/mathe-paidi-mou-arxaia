import { serverSupabaseService } from '../../../utils/supabaseServer'
import { requireAdmin } from '../../../utils/requireAdmin'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const likeId = getRouterParam(event, 'id')
  if (!likeId) throw createError({ statusCode: 400, message: 'Missing id parameter' })
  const supabase = serverSupabaseService()
  const { error } = await supabase.from('article_likes').delete().eq('id', likeId)
  if (error) {
    console.error('[admin/article-likes/[id].delete]', error.message)
    throw createError({ statusCode: 500, message: 'Database operation failed' })
  }
  return { ok: true }
})
