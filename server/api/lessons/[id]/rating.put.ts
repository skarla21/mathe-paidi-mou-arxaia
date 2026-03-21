import { notifyRatingCreated } from '../../../utils/adminNotifications'
import { requireAuth } from '../../../utils/requireAuth'
import { canAccessLesson } from '../../../utils/access'
import { serverSupabaseService } from '../../../utils/supabaseServer'

export default defineEventHandler(async (event) => {
  const userId = requireAuth(event)
  const lessonId = getRouterParam(event, 'id')
  if (!lessonId) throw createError({ statusCode: 400, message: 'Missing lesson id' })

  const { allowed } = await canAccessLesson(userId, lessonId)
  if (!allowed) throw createError({ statusCode: 403, message: 'Access denied' })

  const body = await readBody<{ rating: number }>(event)
  if (!body?.rating || !Number.isInteger(body.rating) || body.rating < 1 || body.rating > 5) {
    throw createError({ statusCode: 400, message: 'Rating must be an integer between 1 and 5' })
  }

  const supabase = serverSupabaseService()
  const { data: existing } = await supabase
    .from('lesson_ratings')
    .select('id')
    .eq('user_id', userId)
    .eq('lesson_id', lessonId)
    .maybeSingle()

  const { data, error } = await supabase
    .from('lesson_ratings')
    .upsert(
      { user_id: userId, lesson_id: lessonId, rating: body.rating },
      { onConflict: 'user_id,lesson_id' },
    )
    .select()
    .single()

  if (error) {
    console.error('[lessons/[id]/rating.put]', error.message)
    throw createError({ statusCode: 500, message: 'Database operation failed' })
  }

  if (!existing && data?.id) {
    try {
      await notifyRatingCreated(supabase, data.id)
    } catch (e) {
      console.error('[lessons/[id]/rating.put] notify', e)
    }
  }

  return data
})
