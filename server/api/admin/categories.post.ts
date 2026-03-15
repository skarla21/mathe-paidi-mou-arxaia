import { serverSupabaseService } from '../../utils/supabaseServer'
import { requireAdmin } from '../../utils/requireAdmin'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const { name, description, order } = await readBody<{ name: string; description?: string; order?: number }>(event)
  if (!name?.trim()) throw createError({ statusCode: 400, message: 'Name is required' })
  const supabase = serverSupabaseService()
  const { data, error } = await supabase.from('categories').insert({ name: name.trim(), description: description ?? null, order: order ?? 0 }).select().single()
  if (error) throw createError({ statusCode: 500, message: error.message })
  return data
})
