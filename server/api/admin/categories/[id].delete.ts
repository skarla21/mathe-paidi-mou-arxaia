import { serverSupabaseService } from '../../../utils/supabaseServer'
import { requireAdmin } from '../../../utils/requireAdmin'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Missing id parameter' })
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
        message: `Cannot delete: ${orphanIds.length} lesson(s) would be left with no placements. Reassign them first.`,
      })
    }
  }

  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) {
    console.error('[admin/categories/[id].delete]', error.message)
    throw createError({ statusCode: 500, message: 'Database operation failed' })
  }
  return { ok: true }
})
