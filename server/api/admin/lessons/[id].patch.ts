import { serverSupabaseService } from '../../../utils/supabaseServer'
import { requireAdmin } from '../../../utils/requireAdmin'
import { placementRowsForUpdate } from '../../../utils/placementOrder'
import { removeUnusedLessonContent } from '../../../utils/lessonStorage'

type PlacementInput = {
  subject_id?: string | null
  chapter_id?: string | null
  category_id?: string | null
}

function assertPlacements(placements: PlacementInput[]) {
  if (!placements.length) {
    throw createError({ statusCode: 400, message: 'Χρειάζεται τουλάχιστον μία ανάθεση' })
  }
  for (const p of placements) {
    const count = [p.subject_id, p.chapter_id, p.category_id].filter(Boolean).length
    if (count !== 1) {
      throw createError({ statusCode: 400, message: 'Κάθε ανάθεση πρέπει να αφορά ακριβώς ένα μάθημα, κεφάλαιο ή κατηγορία' })
    }
  }
}

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Λείπει το αναγνωριστικό' })
  const supabase = serverSupabaseService()
  const body = await readBody<{
    title?: string
    content?: string
    is_free?: boolean
    price?: number
    content_url?: string | null
    placements?: PlacementInput[]
  }>(event)

  if (body.placements !== undefined) assertPlacements(body.placements)

  const updates: Record<string, unknown> = {}
  if (body.title !== undefined) updates.title = body.title.trim()
  if (body.content !== undefined) updates.content = body.content || null
  if (body.is_free !== undefined) updates.is_free = body.is_free
  if (body.price !== undefined) updates.price = body.is_free ? 0 : body.price

  let previousContentUrl: string | null = null
  let replaceContent = false
  if (body.content_url !== undefined) {
    const { data: existing, error: existingError } = await supabase
      .from('lessons')
      .select('content_url')
      .eq('id', id)
      .maybeSingle()
    if (existingError) {
      console.error('[admin/lessons/[id].patch] load content', existingError.message)
      throw createError({ statusCode: 500, message: 'Κάτι πήγε στραβά' })
    }
    previousContentUrl = existing?.content_url ?? null
    updates.content_url = body.content_url || null
    replaceContent = true
  }

  if (!Object.keys(updates).length && body.placements === undefined) {
    throw createError({ statusCode: 400, message: 'Δεν υπάρχει κάτι για ενημέρωση' })
  }

  let data
  if (Object.keys(updates).length) {
    const result = await supabase.from('lessons').update(updates).eq('id', id).select().single()
    if (result.error) {
      console.error('[admin/lessons/[id].patch]', result.error.message)
      throw createError({ statusCode: 500, message: 'Κάτι πήγε στραβά' })
    }
    data = result.data
  }

  if (body.placements !== undefined) {
    try {
      const { data: previous, error: prevErr } = await supabase
        .from('lesson_placements')
        .select('lesson_id, subject_id, chapter_id, category_id, order')
        .eq('lesson_id', id)
      if (prevErr) {
        console.error('[admin/lessons/[id].patch] load placements', prevErr.message)
        throw createError({ statusCode: 500, message: 'Η ανάθεση δεν αποθηκεύτηκε' })
      }

      const placementRows = await placementRowsForUpdate(supabase, id, body.placements, previous ?? [])

      const { error: delErr } = await supabase.from('lesson_placements').delete().eq('lesson_id', id)
      if (delErr) {
        console.error('[admin/lessons/[id].patch] delete placements', delErr.message)
        throw createError({ statusCode: 500, message: 'Η ανάθεση δεν αποθηκεύτηκε' })
      }
      const { error: insErr } = await supabase.from('lesson_placements').insert(placementRows)
      if (insErr) {
        console.error('[admin/lessons/[id].patch] insert placements', insErr.message)
        if (previous?.length) {
          const { error: restoreErr } = await supabase.from('lesson_placements').insert(previous)
          if (restoreErr) console.error('[admin/lessons/[id].patch] restore placements', restoreErr.message)
        }
        if (insErr.code === '23505') {
          throw createError({ statusCode: 409, message: 'Αυτό το υλικό υπάρχει ήδη σε αυτό το μάθημα, κεφάλαιο ή κατηγορία' })
        }
        throw createError({ statusCode: 500, message: 'Η ανάθεση δεν αποθηκεύτηκε' })
      }
    } catch (err) {
      if (replaceContent) {
        const { error: restoreContentErr } = await supabase
          .from('lessons')
          .update({ content_url: previousContentUrl })
          .eq('id', id)
        if (restoreContentErr) {
          console.error('[admin/lessons/[id].patch] restore content', restoreContentErr.message)
        }
      }
      throw err
    }
  }

  const nextContentUrl = body.content_url ? body.content_url : null
  if (replaceContent && previousContentUrl && previousContentUrl !== nextContentUrl) {
    await removeUnusedLessonContent(supabase, previousContentUrl)
  }

  return data ?? { ok: true }
})
