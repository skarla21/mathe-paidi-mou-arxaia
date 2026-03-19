import { serverSupabaseService } from '../../../utils/supabaseServer'
import { requireAdmin } from '../../../utils/requireAdmin'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const body = await readBody<{ grade_id: string; ids: string[] }>(event)
  if (!body?.grade_id?.trim()) {
    throw createError({ statusCode: 400, message: 'grade_id is required' })
  }
  if (!Array.isArray(body.ids) || body.ids.length === 0) {
    throw createError({ statusCode: 400, message: 'ids array is required' })
  }
  const supabase = serverSupabaseService()
  const { data: inGrade, error: qErr } = await supabase
    .from('subjects')
    .select('id')
    .eq('grade_id', body.grade_id)
  if (qErr) {
    console.error('[admin/subjects/reorder]', qErr.message)
    throw createError({ statusCode: 500, message: 'Failed to load subjects' })
  }
  const expected = new Set((inGrade ?? []).map(s => s.id))
  const got = new Set(body.ids)
  if (expected.size !== got.size || body.ids.some(id => !expected.has(id))) {
    throw createError({ statusCode: 400, message: 'ids must list every subject for this grade exactly once' })
  }
  for (let i = 0; i < body.ids.length; i++) {
    const { error } = await supabase
      .from('subjects')
      .update({ order: i })
      .eq('id', body.ids[i])
      .eq('grade_id', body.grade_id)
    if (error) {
      console.error('[admin/subjects/reorder]', error.message)
      throw createError({ statusCode: 500, message: 'Failed to update order' })
    }
  }
  return { ok: true }
})
