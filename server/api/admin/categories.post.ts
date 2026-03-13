import { serverSupabaseService } from '../../utils/supabaseServer'
import { requireAdmin } from '../../utils/requireAdmin'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const { name, order } = await readBody<{ name: string; order?: number }>(event)
  if (!name?.trim()) throw createError({ statusCode: 400, message: 'Name is required' })
  const supabase = serverSupabaseService()
  const { data, error } = await supabase.from('lesson_categories').insert({ name: name.trim(), order: order ?? 0 }).select().single()
  if (error) throw createError({ statusCode: 500, message: error.message })
  return data
})
