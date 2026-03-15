import { serverSupabaseService } from '../../../utils/supabaseServer'
import { requireAdmin } from '../../../utils/requireAdmin'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const id = getRouterParam(event, 'id')
  const body = await readBody<{ name?: string; description?: string; order?: number }>(event)
  const updates: Record<string, unknown> = {}
  if (body.name !== undefined) updates.name = body.name.trim()
  if (body.description !== undefined) updates.description = body.description || null
  if (body.order !== undefined) updates.order = body.order
  if (!Object.keys(updates).length) throw createError({ statusCode: 400, message: 'Nothing to update' })
  const supabase = serverSupabaseService()
  const { data, error } = await supabase.from('categories').update(updates).eq('id', id!).select().single()
  if (error) throw createError({ statusCode: 500, message: error.message })
  return data
})
