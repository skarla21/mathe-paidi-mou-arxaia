import { serverSupabaseService } from '../../../utils/supabaseServer'
import { requireAdmin } from '../../../utils/requireAdmin'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const body = await readBody<{ subject_id: string; ids: string[] }>(event)
  if (!body?.subject_id?.trim()) {
    throw createError({ statusCode: 400, message: 'subject_id is required' })
  }
  if (!Array.isArray(body.ids) || body.ids.length === 0) {
    throw createError({ statusCode: 400, message: 'ids array is required' })
  }
  const supabase = serverSupabaseService()
  const { data: inSubject, error: qErr } = await supabase
    .from('chapters')
    .select('id')
    .eq('subject_id', body.subject_id)
  if (qErr) {
    console.error('[admin/chapters/reorder]', qErr.message)
    throw createError({ statusCode: 500, message: 'Failed to load chapters' })
  }
  const expected = new Set((inSubject ?? []).map(c => c.id))
  const got = new Set(body.ids)
  if (expected.size !== got.size || body.ids.some(id => !expected.has(id))) {
    throw createError({ statusCode: 400, message: 'ids must list every chapter for this subject exactly once' })
  }
  for (let i = 0; i < body.ids.length; i++) {
    const { error } = await supabase
      .from('chapters')
      .update({ order: i })
      .eq('id', body.ids[i])
      .eq('subject_id', body.subject_id)
    if (error) {
      console.error('[admin/chapters/reorder]', error.message)
      throw createError({ statusCode: 500, message: 'Failed to update order' })
    }
  }
  return { ok: true }
})
