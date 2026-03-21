import { notifyArticleCommentCreated } from '../../../utils/adminNotifications'
import { requireAuth } from '../../../utils/requireAuth'
import { serverSupabaseService } from '../../../utils/supabaseServer'

export default defineEventHandler(async (event) => {
  const userId = requireAuth(event)
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

  const body = await readBody<{ body: string }>(event)
  const trimmed = typeof body?.body === 'string' ? body.body.trim() : ''
  if (trimmed.length < 1 || trimmed.length > 2000) {
    throw createError({ statusCode: 400, message: 'Comment body must be between 1 and 2000 characters' })
  }

  const { data: existing } = await supabase
    .from('article_comments')
    .select('id')
    .eq('user_id', userId)
    .eq('article_id', articleId)
    .maybeSingle()

  const { data, error } = await supabase
    .from('article_comments')
    .upsert(
      { user_id: userId, article_id: articleId, body: trimmed },
      { onConflict: 'user_id,article_id' },
    )
    .select()
    .single()

  if (error) {
    console.error('[articles/[id]/comment.put]', error.message)
    throw createError({ statusCode: 500, message: 'Database operation failed' })
  }

  if (!existing && data?.id) {
    try {
      await notifyArticleCommentCreated(supabase, data.id)
    } catch (e) {
      console.error('[articles/[id]/comment.put] notify', e)
    }
  }

  return data
})
