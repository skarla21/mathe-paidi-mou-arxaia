import { serverSupabaseService } from '../../utils/supabaseServer'
import { requireAdmin } from '../../utils/requireAdmin'
import { placementRowsForCreate } from '../../utils/placementOrder'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const body = await readBody<{
    title: string; content?: string; is_free?: boolean; price?: number
    content_url?: string
    placements?: Array<{ subject_id?: string | null; chapter_id?: string | null; category_id?: string | null }>
  }>(event)
  if (!body.title?.trim()) throw createError({ statusCode: 400, message: 'Ο τίτλος είναι υποχρεωτικός' })
  if (!body.placements?.length) {
    throw createError({ statusCode: 400, message: 'Χρειάζεται τουλάχιστον μία ανάθεση' })
  }
  // Validate each placement has exactly one parent
  for (const p of body.placements) {
    const count = [p.subject_id, p.chapter_id, p.category_id].filter(Boolean).length
    if (count !== 1) {
      throw createError({ statusCode: 400, message: 'Κάθε ανάθεση πρέπει να αφορά ακριβώς ένα μάθημα, κεφάλαιο ή κατηγορία' })
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
    throw createError({ statusCode: 500, message: 'Κάτι πήγε στραβά' })
  }

  const placementRows = await placementRowsForCreate(supabase, data.id, body.placements)
  const { error: placementErr } = await supabase.from('lesson_placements').insert(placementRows)
  if (placementErr) {
    console.error('[admin/lessons.post] placements', placementErr.message)
    // Clean up the lesson if placements fail
    await supabase.from('lessons').delete().eq('id', data.id)
    if (placementErr.code === '23505') {
      throw createError({ statusCode: 409, message: 'Αυτό το υλικό υπάρχει ήδη σε αυτό το μάθημα, κεφάλαιο ή κατηγορία' })
    }
    throw createError({ statusCode: 500, message: 'Η ανάθεση δεν αποθηκεύτηκε' })
  }

  return data
})
