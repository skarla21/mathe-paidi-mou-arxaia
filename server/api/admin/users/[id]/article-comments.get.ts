import { serverSupabaseService } from '../../../../utils/supabaseServer'
import { requireAdmin } from '../../../../utils/requireAdmin'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Missing user id' })
  const supabase = serverSupabaseService()
  const { data, error } = await supabase
    .from('article_comments')
    .select('*, articles(title)')
    .eq('user_id', id)
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) {
    console.error('[admin/users/[id]/article-comments.get]', error.message)
    throw createError({ statusCode: 500, message: 'Database operation failed' })
  }
  return data ?? []
})
