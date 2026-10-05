import { canonicalLessonPaths, chapterPublicPath } from '../utils/contentPath'
import { serverSupabaseAnon } from '../utils/supabaseServer'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const lessonId = typeof query.lesson === 'string' ? query.lesson : ''
  const chapterId = typeof query.chapter === 'string' ? query.chapter : ''
  if (Boolean(lessonId) === Boolean(chapterId)) {
    throw createError({ statusCode: 400, message: 'Λείπει το αναγνωριστικό' })
  }
  if ((lessonId && !UUID.test(lessonId)) || (chapterId && !UUID.test(chapterId))) {
    throw createError({ statusCode: 404, message: 'Δεν βρέθηκε' })
  }

  const supabase = serverSupabaseAnon()
  if (lessonId) {
    const { data, error } = await supabase.from('lessons').select('id').eq('id', lessonId).maybeSingle()
    if (error) throw createError({ statusCode: 500, message: 'Κάτι πήγε στραβά' })
    if (!data) throw createError({ statusCode: 404, message: 'Δεν βρέθηκε' })
    const paths = await canonicalLessonPaths(supabase, [lessonId])
    return { url: paths.get(lessonId) ?? null }
  }

  const { data, error } = await supabase
    .from('chapters')
    .select('slug, subjects(slug, grades(slug))')
    .eq('id', chapterId)
    .maybeSingle()
  if (error) throw createError({ statusCode: 500, message: 'Κάτι πήγε στραβά' })
  if (!data) throw createError({ statusCode: 404, message: 'Δεν βρέθηκε' })
  const url = chapterPublicPath(data)
  if (!url) throw createError({ statusCode: 404, message: 'Δεν βρέθηκε' })
  return { url }
})
