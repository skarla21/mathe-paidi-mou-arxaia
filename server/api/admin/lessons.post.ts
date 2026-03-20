import { serverSupabaseService } from '../../utils/supabaseServer'
import { requireAdmin } from '../../utils/requireAdmin'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const body = await readBody<{
    title: string; content?: string; is_free?: boolean; price?: number
    content_url?: string
    placements?: Array<{ chapter_id?: string | null; category_id?: string | null }>
  }>(event)
  if (!body.title?.trim()) throw createError({ statusCode: 400, message: 'Title is required' })
  if (!body.placements?.length) {
    throw createError({ statusCode: 400, message: 'At least one placement is required' })
  }
  // Validate each placement has exactly one parent
  for (const p of body.placements) {
    const count = [p.chapter_id, p.category_id].filter(Boolean).length
    if (count !== 1) {
      throw createError({ statusCode: 400, message: 'Each placement must have exactly one of chapter_id or category_id' })
    }
  }
  const supabase = serverSupabaseService()

  // Insert lesson (no parent columns)
  const { data, error } = await supabase.from('lessons').insert({
    title: body.title.trim(),
    content: body.content ?? null,
    is_free: body.is_free ?? true,
    price: body.is_free ? 0 : (body.price ?? 0),
    content_url: body.content_url ?? null,
  }).select().single()
  if (error) {
    console.error('[admin/lessons.post]', error.message)
    throw createError({ statusCode: 500, message: 'Database operation failed' })
  }

  // Insert placements
  const placementRows = body.placements.map((p, i) => ({
    lesson_id: data.id,
    chapter_id: p.chapter_id ?? null,
    category_id: p.category_id ?? null,
    order: i,
  }))
  const { error: placementErr } = await supabase.from('lesson_placements').insert(placementRows)
  if (placementErr) {
    console.error('[admin/lessons.post] placements', placementErr.message)
    // Clean up the lesson if placements fail
    await supabase.from('lessons').delete().eq('id', data.id)
    if (placementErr.code === '23505') {
      throw createError({ statusCode: 409, message: 'Duplicate placement: lesson already exists in that chapter or category' })
    }
    throw createError({ statusCode: 500, message: 'Failed to create placements' })
  }

  return data
})
