import { serverSupabaseService } from '../../utils/supabaseServer'
import { requireAdmin } from '../../utils/requireAdmin'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const body = await readBody<{ name: string; description?: string; image_url?: string; order?: number }>(event)
  if (!body.name?.trim()) throw createError({ statusCode: 400, message: 'Το όνομα είναι υποχρεωτικό' })
  const supabase = serverSupabaseService()
  const { data, error } = await supabase.from('categories').insert({
    name: body.name.trim(),
    description: body.description ?? null,
    image_url: body.image_url ?? null,
    order: body.order ?? 0,
  }).select().single()
  if (error) {
    console.error('[admin/categories.post]', error.message)
    throw createError({ statusCode: 500, message: 'Κάτι πήγε στραβά' })
  }
  return data
})
