import { serverSupabaseService } from '../../../utils/supabaseServer'
import { requireAdmin } from '../../../utils/requireAdmin'
export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Λείπει το αναγνωριστικό' })
  const body = await readBody<{ name?: string; order?: number }>(event)
  const updates: Record<string, unknown> = {}
  const supabase = serverSupabaseService()
  if (body.name !== undefined) updates.name = body.name.trim()
  if (body.order !== undefined) updates.order = body.order
  if (!Object.keys(updates).length) throw createError({ statusCode: 400, message: 'Δεν υπάρχει κάτι για ενημέρωση' })
  const { data, error } = await supabase.from('grades').update(updates).eq('id', id).select().single()
  if (error) {
    console.error('[admin/grades/[id].patch]', error.message)
    throw createError({ statusCode: 500, message: 'Κάτι πήγε στραβά' })
  }
  return data
})
