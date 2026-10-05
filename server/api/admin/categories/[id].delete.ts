import { serverSupabaseService } from '../../../utils/supabaseServer'
import { requireAdmin } from '../../../utils/requireAdmin'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Λείπει το αναγνωριστικό' })
  const supabase = serverSupabaseService()

  // Check for lessons that would become orphans (only placement is in this category)
  const { data: atRisk } = await supabase
    .from('lesson_placements')
    .select('lesson_id')
    .eq('category_id', id)
  if (atRisk?.length) {
    const lessonIds = atRisk.map(p => p.lesson_id)
    // For each lesson, check if it has placements elsewhere
    const { data: allPlacements } = await supabase
      .from('lesson_placements')
      .select('lesson_id, chapter_id, category_id')
      .in('lesson_id', lessonIds)
    const orphanIds = lessonIds.filter(lid =>
      (allPlacements ?? []).filter(p => p.lesson_id === lid).every(p => p.category_id === id),
    )
    if (orphanIds.length) {
      throw createError({
        statusCode: 409,
        message: orphanIds.length === 1
          ? 'Δεν γίνεται διαγραφή: ένα υλικό θα μείνει χωρίς ανάθεση. Ανάθεσέ το αλλού πρώτα.'
          : `Δεν γίνεται διαγραφή: ${orphanIds.length} υλικά θα μείνουν χωρίς ανάθεση. Ανάθεσέ τα αλλού πρώτα.`,
      })
    }
  }

  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) {
    console.error('[admin/categories/[id].delete]', error.message)
    throw createError({ statusCode: 500, message: 'Κάτι πήγε στραβά' })
  }
  return { ok: true }
})
