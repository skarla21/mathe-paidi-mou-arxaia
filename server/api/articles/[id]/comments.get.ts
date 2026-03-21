import { serverSupabaseService } from '../../../utils/supabaseServer'

export default defineEventHandler(async (event) => {
  const articleId = getRouterParam(event, 'id')
  if (!articleId) throw createError({ statusCode: 400, message: 'Missing article id' })

  const supabase = serverSupabaseService()
  const { data: article } = await supabase
    .from('articles')
    .select('id')
    .eq('id', articleId)
    .eq('published', true)
    .maybeSingle()
  if (!article) throw createError({ statusCode: 404, message: 'Not found' })

  const query = getQuery(event)
  const limit = Math.min(Math.max(Number(query.limit) || 50, 1), 100)

  const { data, error } = await supabase
    .from('article_comments')
    .select('id, body, created_at, updated_at, users(id, name, avatar_url)')
    .eq('article_id', articleId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[articles/[id]/comments.get]', error.message)
    throw createError({ statusCode: 500, message: 'Database operation failed' })
  }

  return data ?? []
})
