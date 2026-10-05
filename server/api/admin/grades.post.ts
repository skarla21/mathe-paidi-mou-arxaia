import { serverSupabaseService } from '../../utils/supabaseServer'
import { requireAdmin } from '../../utils/requireAdmin'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const { name, order } = await readBody<{ name: string; order?: number }>(event)
  if (!name?.trim()) throw createError({ statusCode: 400, message: 'Το όνομα είναι υποχρεωτικό' })
  const supabase = serverSupabaseService()
  const { data, error } = await supabase
    .from('grades').insert({ name: name.trim(), order: order ?? 0 }).select().single()
  if (error) {
    console.error('[admin/grades.post]', error.message)
    throw createError({ statusCode: 500, message: 'Κάτι πήγε στραβά' })
  }
  return data
})
