import { serverSupabaseService } from '../../../utils/supabaseServer'
import { requireAdmin } from '../../../utils/requireAdmin'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Λείπει το αναγνωριστικό' })
  const body = await readBody<{
    title?: string; description?: string; subject_id?: string
    image_url?: string; order?: number
  }>(event)
  const updates: Record<string, unknown> = {}
  if (body.title !== undefined) updates.title = body.title.trim()
  if (body.description !== undefined) updates.description = body.description || null
  if (body.image_url !== undefined) updates.image_url = body.image_url || null
  if (body.order !== undefined) updates.order = body.order
  const supabase = serverSupabaseService()
  if (body.subject_id !== undefined) {
    const { data: subject } = await supabase.from('subjects').select('grade_id').eq('id', body.subject_id).single()
    if (!subject) throw createError({ statusCode: 400, message: 'Το μάθημα δεν βρέθηκε' })
    updates.subject_id = body.subject_id
    updates.grade_id = subject.grade_id
  }
  if (!Object.keys(updates).length) throw createError({ statusCode: 400, message: 'Δεν υπάρχει κάτι για ενημέρωση' })
  const { data, error } = await supabase.from('chapters').update(updates).eq('id', id).select().single()
  if (error) {
    console.error('[admin/chapters/[id].patch]', error.message)
    throw createError({ statusCode: 500, message: 'Κάτι πήγε στραβά' })
  }
  return data
})
