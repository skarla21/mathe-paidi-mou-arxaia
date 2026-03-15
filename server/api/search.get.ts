import { serverSupabaseService } from '../utils/supabaseServer'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const q = (query.q as string)?.trim()
  if (!q || q.length < 2) {
    return []
  }
  const supabase = serverSupabaseService()
  const pattern = `%${q}%`
  const [chaptersRes, lessonsRes] = await Promise.all([
    supabase.from('chapters').select('id, title').ilike('title', pattern).limit(10),
    supabase.from('lessons').select('id, title, chapter_id').ilike('title', pattern).limit(10),
  ])
  const results: { type: 'chapter' | 'lesson'; id: string; title: string; url: string }[] = []
  for (const row of chaptersRes.data ?? []) {
    results.push({ type: 'chapter', id: row.id, title: row.title, url: `/chapter/${row.id}` })
  }
  for (const row of lessonsRes.data ?? []) {
    results.push({ type: 'lesson', id: row.id, title: row.title, url: `/lesson/${row.id}` })
  }
  return results
})
