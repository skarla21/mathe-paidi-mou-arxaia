import { serverSupabaseService } from '../../utils/supabaseServer'
import { requireAdmin } from '../../utils/requireAdmin'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const body = await readBody<{ name: string; grade_id: string; image_url?: string }>(event)
  if (!body.name?.trim() || !body.grade_id) throw createError({ statusCode: 400, message: 'Απαιτούνται όνομα και τάξη' })
  const supabase = serverSupabaseService()
  const { data, error } = await supabase.from('subjects').insert({
    name: body.name.trim(),
    grade_id: body.grade_id,
    image_url: body.image_url ?? null,
  }).select().single()
  if (error) {
    console.error('[admin/subjects.post]', error.message)
    throw createError({ statusCode: 500, message: 'Κάτι πήγε στραβά' })
  }
  return data
})
