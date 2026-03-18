import { serverSupabaseService } from '../../../utils/supabaseServer'
import { requireAdmin } from '../../../utils/requireAdmin'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const body = await readBody<{ ids: string[] }>(event)
  if (!Array.isArray(body?.ids) || body.ids.length === 0) {
    throw createError({ statusCode: 400, message: 'ids array is required' })
  }
  const supabase = serverSupabaseService()
  for (let i = 0; i < body.ids.length; i++) {
    const { error } = await supabase
      .from('subjects')
      .update({ order: i })
      .eq('id', body.ids[i])
    if (error) {
      console.error('[admin/subjects/reorder]', error.message)
      throw createError({ statusCode: 500, message: 'Failed to update order' })
    }
  }
  return { ok: true }
})
