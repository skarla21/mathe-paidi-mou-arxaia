import { serverSupabaseService } from '../../../utils/supabaseServer'
import { requireAdmin } from '../../../utils/requireAdmin'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Missing id parameter' })
  const body = await readBody<{
    title?: string; content?: string; is_free?: boolean; price?: number
    content_url?: string; order?: number
    chapter_id?: string | null; subject_id?: string | null; category_id?: string | null
  }>(event)
  const hasParentChange = body.chapter_id !== undefined || body.subject_id !== undefined || body.category_id !== undefined
  if (hasParentChange) {
    const parentCount = [
      body.chapter_id !== undefined ? body.chapter_id : undefined,
      body.subject_id !== undefined ? body.subject_id : undefined,
      body.category_id !== undefined ? body.category_id : undefined,
    ].filter((v) => v !== undefined && v !== null).length
    if (parentCount !== 1) {
      throw createError({ statusCode: 400, message: 'Exactly one of chapter_id, subject_id, or category_id must be set' })
    }
  }
  const updates: Record<string, unknown> = {}
  if (body.title !== undefined) updates.title = body.title.trim()
  if (body.content !== undefined) updates.content = body.content || null
  if (body.is_free !== undefined) updates.is_free = body.is_free
  if (body.price !== undefined) updates.price = body.is_free ? 0 : body.price
  if (body.content_url !== undefined) updates.content_url = body.content_url || null
  if (body.order !== undefined) updates.order = body.order
  if (body.chapter_id !== undefined) updates.chapter_id = body.chapter_id
  if (body.subject_id !== undefined) updates.subject_id = body.subject_id
  if (body.category_id !== undefined) updates.category_id = body.category_id
  if (!Object.keys(updates).length) throw createError({ statusCode: 400, message: 'Nothing to update' })
  const supabase = serverSupabaseService()
  const { data, error } = await supabase.from('lessons').update(updates).eq('id', id).select().single()
  if (error) {
    console.error('[admin/lessons/[id].patch]', error.message)
    throw createError({ statusCode: 500, message: 'Database operation failed' })
  }
  return data
})
