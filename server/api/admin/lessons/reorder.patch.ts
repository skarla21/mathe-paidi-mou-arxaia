import { serverSupabaseService } from '../../../utils/supabaseServer'
import { requireAdmin } from '../../../utils/requireAdmin'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const body = await readBody<{ chapter_id?: string; category_id?: string; ids: string[] }>(event)
  const hasChapter = !!body?.chapter_id?.trim()
  const hasCategory = !!body?.category_id?.trim()
  if (hasChapter === hasCategory) {
    throw createError({ statusCode: 400, message: 'Exactly one of chapter_id or category_id is required' })
  }
  if (!Array.isArray(body.ids) || body.ids.length === 0) {
    throw createError({ statusCode: 400, message: 'ids array is required' })
  }
  const supabase = serverSupabaseService()
  if (hasChapter) {
    const chapterId = body.chapter_id!
    const { data: inChapter, error: qErr } = await supabase
      .from('lessons')
      .select('id')
      .eq('chapter_id', chapterId)
    if (qErr) {
      console.error('[admin/lessons/reorder]', qErr.message)
      throw createError({ statusCode: 500, message: 'Failed to load lessons' })
    }
    const expected = new Set((inChapter ?? []).map(l => l.id))
    if (expected.size !== body.ids.length || body.ids.some(id => !expected.has(id))) {
      throw createError({ statusCode: 400, message: 'ids must list every lesson in this chapter exactly once' })
    }
    for (let i = 0; i < body.ids.length; i++) {
      const { error } = await supabase
        .from('lessons')
        .update({ order: i })
        .eq('id', body.ids[i])
        .eq('chapter_id', chapterId)
      if (error) {
        console.error('[admin/lessons/reorder]', error.message)
        throw createError({ statusCode: 500, message: 'Failed to update order' })
      }
    }
  } else {
    const categoryId = body.category_id!
    const { data: inCat, error: qErr } = await supabase
      .from('lessons')
      .select('id')
      .eq('category_id', categoryId)
    if (qErr) {
      console.error('[admin/lessons/reorder]', qErr.message)
      throw createError({ statusCode: 500, message: 'Failed to load lessons' })
    }
    const expected = new Set((inCat ?? []).map(l => l.id))
    if (expected.size !== body.ids.length || body.ids.some(id => !expected.has(id))) {
      throw createError({ statusCode: 400, message: 'ids must list every lesson in this category exactly once' })
    }
    for (let i = 0; i < body.ids.length; i++) {
      const { error } = await supabase
        .from('lessons')
        .update({ order: i })
        .eq('id', body.ids[i])
        .eq('category_id', categoryId)
      if (error) {
        console.error('[admin/lessons/reorder]', error.message)
        throw createError({ statusCode: 500, message: 'Failed to update order' })
      }
    }
  }
  return { ok: true }
})
