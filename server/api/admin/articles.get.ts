import { serverSupabaseService } from '../../utils/supabaseServer'
import { requireAdmin } from '../../utils/requireAdmin'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const supabase = serverSupabaseService()

  const { data: articles, error: articlesErr } = await supabase
    .from('articles')
    .select('*')
    .order('created_at', { ascending: false })
  if (articlesErr) {
    console.error('[admin/articles.get]', articlesErr.message)
    throw createError({ statusCode: 500, message: 'Database operation failed' })
  }

  const [likesRes, commentsRes] = await Promise.all([
    supabase.from('article_likes').select('article_id'),
    supabase.from('article_comments').select('article_id'),
  ])
  if (likesRes.error) console.error('[admin/articles.get] likes', likesRes.error.message)
  if (commentsRes.error) console.error('[admin/articles.get] comments', commentsRes.error.message)

  const likeCount = new Map<string, number>()
  for (const r of likesRes.data ?? []) {
    const id = (r as { article_id: string }).article_id
    likeCount.set(id, (likeCount.get(id) ?? 0) + 1)
  }
  const commentCount = new Map<string, number>()
  for (const r of commentsRes.data ?? []) {
    const id = (r as { article_id: string }).article_id
    commentCount.set(id, (commentCount.get(id) ?? 0) + 1)
  }

  return (articles ?? []).map((a) => ({
    ...a,
    likeCount: likeCount.get(a.id) ?? 0,
    commentCount: commentCount.get(a.id) ?? 0,
  }))
})
