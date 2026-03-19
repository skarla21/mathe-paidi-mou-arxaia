import { serverSupabaseService } from '../../../utils/supabaseServer'
import { requireAdmin } from '../../../utils/requireAdmin'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const body = await readBody<{ ids: string[] }>(event)
  if (!Array.isArray(body?.ids) || body.ids.length === 0) {
    throw createError({ statusCode: 400, message: 'ids array is required' })
  }
  const supabase = serverSupabaseService()
  const { data: allCats, error: qErr } = await supabase.from('categories').select('id')
  if (qErr) {
    console.error('[admin/categories/reorder]', qErr.message)
    throw createError({ statusCode: 500, message: 'Failed to load categories' })
  }
  const expected = new Set((allCats ?? []).map(c => c.id))
  const got = new Set(body.ids)
  if (expected.size !== got.size || body.ids.some(id => !expected.has(id))) {
    throw createError({ statusCode: 400, message: 'ids must list every category exactly once' })
  }
  for (let i = 0; i < body.ids.length; i++) {
    const { error } = await supabase
      .from('categories')
      .update({ order: i })
      .eq('id', body.ids[i])
    if (error) {
      console.error('[admin/categories/reorder]', error.message)
      throw createError({ statusCode: 500, message: 'Failed to update order' })
    }
  }
  return { ok: true }
})
