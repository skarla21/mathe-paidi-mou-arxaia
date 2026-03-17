import { serverSupabaseService } from '../../../utils/supabaseServer'
import { requireAdmin } from '../../../utils/requireAdmin'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Missing id parameter' })
  const supabase = serverSupabaseService()
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) {
    console.error('[admin/categories/[id].delete]', error.message)
    throw createError({ statusCode: 500, message: 'Database operation failed' })
  }
  return { ok: true }
})
