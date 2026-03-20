import { serverSupabaseService } from '../../../utils/supabaseServer'
import { requireAdmin } from '../../../utils/requireAdmin'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Missing id parameter' })
  const supabase = serverSupabaseService()
  const body = await readBody<{
    title?: string; content?: string; is_free?: boolean; price?: number
    content_url?: string
    placements?: Array<{ chapter_id?: string | null; category_id?: string | null }>
  }>(event)

  // Build lesson field updates
  const updates: Record<string, unknown> = {}
  if (body.title !== undefined) updates.title = body.title.trim()
  if (body.content !== undefined) updates.content = body.content || null
  if (body.is_free !== undefined) updates.is_free = body.is_free
  if (body.price !== undefined) updates.price = body.is_free ? 0 : body.price
  if (body.content_url !== undefined) updates.content_url = body.content_url || null

  // Update lesson fields if any
  let data
  if (Object.keys(updates).length) {
    const result = await supabase.from('lessons').update(updates).eq('id', id).select().single()
    if (result.error) {
      console.error('[admin/lessons/[id].patch]', result.error.message)
      throw createError({ statusCode: 500, message: 'Database operation failed' })
    }
    data = result.data
  }

  // Update placements if provided
  if (body.placements !== undefined) {
    if (!body.placements?.length) {
      throw createError({ statusCode: 400, message: 'At least one placement is required' })
    }
    for (const p of body.placements) {
      const count = [p.chapter_id, p.category_id].filter(Boolean).length
      if (count !== 1) {
        throw createError({ statusCode: 400, message: 'Each placement must have exactly one of chapter_id or category_id' })
      }
    }
    // Delete existing placements and insert new ones
    const { error: delErr } = await supabase.from('lesson_placements').delete().eq('lesson_id', id)
    if (delErr) {
      console.error('[admin/lessons/[id].patch] delete placements', delErr.message)
      throw createError({ statusCode: 500, message: 'Failed to update placements' })
    }
    const placementRows = body.placements.map((p, i) => ({
      lesson_id: id,
      chapter_id: p.chapter_id ?? null,
      category_id: p.category_id ?? null,
      order: i,
    }))
    const { error: insErr } = await supabase.from('lesson_placements').insert(placementRows)
    if (insErr) {
      console.error('[admin/lessons/[id].patch] insert placements', insErr.message)
      if (insErr.code === '23505') {
        throw createError({ statusCode: 409, message: 'Duplicate placement: lesson already exists in that chapter or category' })
      }
      throw createError({ statusCode: 500, message: 'Failed to update placements' })
    }
  }

  if (!data && !body.placements) {
    throw createError({ statusCode: 400, message: 'Nothing to update' })
  }

  return data ?? { ok: true }
})
