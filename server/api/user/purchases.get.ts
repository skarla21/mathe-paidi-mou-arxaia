import { requireAuth } from '../../utils/requireAuth'
import { serverSupabaseService } from '../../utils/supabaseServer'
import { canonicalLessonPaths } from '../../utils/contentPath'

export default defineEventHandler(async (event) => {
  const userId = requireAuth(event)
  const supabase = serverSupabaseService()

  const { data, error } = await supabase
    .from('purchases')
    .select('lesson_id, lessons(id, title, is_free, price)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[user/purchases.get]', error.message)
    throw createError({ statusCode: 500, message: 'Database operation failed' })
  }

  const lessons = (data ?? [])
    .map((p: Record<string, unknown>) => p.lessons as { id: string; title: string; is_free: boolean; price: number } | null)
    .filter((lesson): lesson is { id: string; title: string; is_free: boolean; price: number } => Boolean(lesson))
  const paths = await canonicalLessonPaths(supabase, lessons.map((lesson) => lesson.id))
  return lessons.map((lesson) => ({ ...lesson, url: paths.get(lesson.id) ?? null }))
})
