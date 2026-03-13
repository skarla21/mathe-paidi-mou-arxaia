import { serverSupabaseService } from '../../../utils/supabaseServer'
import { requireAdmin } from '../../../utils/requireAdmin'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const id = getRouterParam(event, 'id')
  const body = await readBody<{
    title?: string; content?: string; is_free?: boolean
    pdf_url?: string; order?: number; course_id?: string | null; category_id?: string | null
  }>(event)
  if (body.course_id && body.category_id) {
    throw createError({ statusCode: 400, message: 'Cannot assign to both course and category' })
  }
  const updates: Record<string, unknown> = {}
  if (body.title !== undefined) updates.title = body.title.trim()
  if (body.content !== undefined) updates.content = body.content || null
  if (body.is_free !== undefined) updates.is_free = body.is_free
  if (body.pdf_url !== undefined) updates.pdf_url = body.pdf_url || null
  if (body.order !== undefined) updates.order = body.order
  if (body.course_id !== undefined) updates.course_id = body.course_id
  if (body.category_id !== undefined) updates.category_id = body.category_id
  if (!Object.keys(updates).length) throw createError({ statusCode: 400, message: 'Nothing to update' })
  const supabase = serverSupabaseService()
  const { data, error } = await supabase.from('lessons').update(updates).eq('id', id!).select().single()
  if (error) throw createError({ statusCode: 500, message: error.message })
  return data
})
