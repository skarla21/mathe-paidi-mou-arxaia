import { serverSupabaseService } from '../../../utils/supabaseServer'
import { requireAdmin } from '../../../utils/requireAdmin'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const id = getRouterParam(event, 'id')
  const body = await readBody<{
    title?: string; description?: string; subject_id?: string
    is_free?: boolean; price?: number; thumbnail_url?: string
  }>(event)
  const updates: Record<string, unknown> = {}
  if (body.title !== undefined) updates.title = body.title.trim()
  if (body.description !== undefined) updates.description = body.description || null
  if (body.is_free !== undefined) updates.is_free = body.is_free
  if (body.price !== undefined) updates.price = body.is_free ? 0 : body.price
  if (body.thumbnail_url !== undefined) updates.thumbnail_url = body.thumbnail_url || null
  const supabase = serverSupabaseService()
  if (body.subject_id !== undefined) {
    const { data: subject } = await supabase.from('subjects').select('grade_id').eq('id', body.subject_id).single()
    if (!subject) throw createError({ statusCode: 400, message: 'Subject not found' })
    updates.subject_id = body.subject_id
    updates.grade_id = subject.grade_id
  }
  if (!Object.keys(updates).length) throw createError({ statusCode: 400, message: 'Nothing to update' })
  const { data, error } = await supabase.from('courses').update(updates).eq('id', id!).select().single()
  if (error) throw createError({ statusCode: 500, message: error.message })
  return data
})
