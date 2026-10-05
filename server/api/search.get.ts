import { serverSupabaseAnon } from '../utils/supabaseServer'
import { canonicalLessonPaths, publicSearchResults, SEARCH_CANDIDATE_LIMIT } from '../utils/contentPath'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const q = (query.q as string)?.trim()
  if (!q || q.length < 2) {
    return []
  }
  const supabase = serverSupabaseAnon()
  const pattern = `%${q}%`
  const [chaptersRes, lessonsRes] = await Promise.all([
    supabase
      .from('chapters')
      .select('id, title, slug, subjects(slug, grades(slug))')
      .ilike('title', pattern)
      .order('title')
      .limit(SEARCH_CANDIDATE_LIMIT),
    supabase
      .from('lessons')
      .select('id, title')
      .ilike('title', pattern)
      .order('title')
      .limit(SEARCH_CANDIDATE_LIMIT),
  ])
  if (chaptersRes.error || lessonsRes.error) {
    throw createError({ statusCode: 500, message: 'Κάτι πήγε στραβά' })
  }
  const lessonIds = (lessonsRes.data ?? []).map((row) => row.id)
  const lessonPaths = await canonicalLessonPaths(supabase, lessonIds)
  return publicSearchResults({
    chapters: chaptersRes.data,
    lessons: lessonsRes.data,
    lessonPaths,
  })
})
