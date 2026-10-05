import { serverSupabaseAnon } from '../utils/supabaseServer'
import { canonicalLessonPaths, chapterPublicPath } from '../utils/contentPath'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const q = (query.q as string)?.trim()
  if (!q || q.length < 2) {
    return []
  }
  const supabase = serverSupabaseAnon()
  const pattern = `%${q}%`
  const [chaptersRes, lessonsRes] = await Promise.all([
    supabase.from('chapters').select('id, title, slug, subjects(slug, grades(slug))').ilike('title', pattern).limit(10),
    supabase.from('lessons').select('id, title').ilike('title', pattern).limit(10),
  ])
  const lessonIds = (lessonsRes.data ?? []).map((row) => row.id)
  const lessonPaths = await canonicalLessonPaths(supabase, lessonIds)
  const results: { type: 'chapter' | 'lesson'; id: string; title: string; url: string }[] = []
  for (const row of chaptersRes.data ?? []) {
    results.push({ type: 'chapter', id: row.id, title: row.title, url: chapterPublicPath(row) ?? `/chapter/${row.id}` })
  }
  for (const row of lessonsRes.data ?? []) {
    results.push({ type: 'lesson', id: row.id, title: row.title, url: lessonPaths.get(row.id) ?? `/lesson/${row.id}` })
  }
  return results
})
