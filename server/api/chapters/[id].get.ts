import { serverSupabaseAnon } from '../../utils/supabaseServer'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Missing chapter id' })
  const supabase = serverSupabaseAnon()

  // Fetch chapter
  const { data: chapter, error: chErr } = await supabase.from('chapters').select('*').eq('id', id).single()
  if (chErr || !chapter) throw createError({ statusCode: 404, message: 'Chapter not found' })

  // Fetch lessons through lesson_placements
  const { data: placements, error: plErr } = await supabase
    .from('lesson_placements')
    .select('order, lessons(id, slug, title, is_free, price, created_at)')
    .eq('chapter_id', id)
    .order('order', { ascending: true })
  if (plErr) {
    console.error('[chapters/[id].get]', plErr.message)
    throw createError({ statusCode: 500, message: 'Database operation failed' })
  }

  // Unwrap to flat lesson array
  const lessons = (placements ?? []).map((row: { order: number; lessons: unknown }) => {
    const lesson = row.lessons as Record<string, unknown> | null
    return lesson ? { ...lesson, order: row.order } : null
  }).filter(Boolean)

  return { ...chapter, lessons }
})
