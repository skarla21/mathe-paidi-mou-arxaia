import { serverSupabaseService } from '../../../utils/supabaseServer'
import { requireAdmin } from '../../../utils/requireAdmin'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const body = await readBody<{ subject_id?: string; chapter_id?: string; category_id?: string; ids: string[] }>(event)
  const hasSubject = !!body?.subject_id?.trim()
  const hasChapter = !!body?.chapter_id?.trim()
  const hasCategory = !!body?.category_id?.trim()
  if ([hasSubject, hasChapter, hasCategory].filter(Boolean).length !== 1) {
    throw createError({ statusCode: 400, message: 'Exactly one of subject_id, chapter_id, or category_id is required' })
  }
  if (!Array.isArray(body.ids) || body.ids.length === 0) {
    throw createError({ statusCode: 400, message: 'ids array is required' })
  }
  const supabase = serverSupabaseService()

  // Query through lesson_placements instead of lessons
  const parentCol = hasSubject ? 'subject_id' : hasChapter ? 'chapter_id' : 'category_id'
  const parentId = hasSubject ? body.subject_id! : hasChapter ? body.chapter_id! : body.category_id!
  const parentLabel = hasSubject ? 'subject' : hasChapter ? 'chapter' : 'category'

  const { data: inParent, error: qErr } = await supabase
    .from('lesson_placements')
    .select('lesson_id')
    .eq(parentCol, parentId)
  if (qErr) {
    console.error('[admin/lessons/reorder]', qErr.message)
    throw createError({ statusCode: 500, message: 'Failed to load lessons' })
  }
  const expected = new Set((inParent ?? []).map(p => p.lesson_id))
  if (new Set(body.ids).size !== body.ids.length || expected.size !== body.ids.length || body.ids.some(id => !expected.has(id))) {
    throw createError({ statusCode: 400, message: `ids must list every lesson in this ${parentLabel} exactly once` })
  }

  // Update order on lesson_placements
  for (let i = 0; i < body.ids.length; i++) {
    const { error } = await supabase
      .from('lesson_placements')
      .update({ order: i })
      .eq('lesson_id', body.ids[i])
      .eq(parentCol, parentId)
    if (error) {
      console.error('[admin/lessons/reorder]', error.message)
      throw createError({ statusCode: 500, message: 'Failed to update order' })
    }
  }
  return { ok: true }
})
