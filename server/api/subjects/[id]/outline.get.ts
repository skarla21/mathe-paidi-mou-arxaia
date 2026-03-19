import { serverSupabaseAnon } from '../../../utils/supabaseServer'
import type { SubjectOutlineRow } from '../../../../types/database'

function single<T>(v: T | T[] | null | undefined): T | null {
  if (v == null) return null
  return Array.isArray(v) ? (v[0] ?? null) : v
}

export default defineEventHandler(async (event) => {
  const subjectId = getRouterParam(event, 'id')
  if (!subjectId) throw createError({ statusCode: 400, message: 'Missing subject id' })
  const supabase = serverSupabaseAnon()
  const { data: rows, error } = await supabase
    .from('subject_outline_items')
    .select(`
      position,
      chapter_id,
      lesson_id,
      chapters ( id, title ),
      lessons ( id, title, is_free )
    `)
    .eq('subject_id', subjectId)
    .order('position', { ascending: true })
  if (error) {
    console.error('[subjects/[id]/outline.get]', error.message)
    throw createError({ statusCode: 500, message: 'Database operation failed' })
  }
  const out: SubjectOutlineRow[] = []
  for (const row of rows ?? []) {
    const ch = single(row.chapters as { id: string; title: string } | { id: string; title: string }[] | null)
    const le = single(row.lessons as { id: string; title: string; is_free: boolean } | { id: string; title: string; is_free: boolean }[] | null)
    if (ch) out.push({ kind: 'chapter', id: ch.id, title: ch.title })
    else if (le) out.push({ kind: 'lesson', id: le.id, title: le.title, is_free: le.is_free })
  }
  return out
})
