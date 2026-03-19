import { serverSupabaseService } from '../../../../utils/supabaseServer'
import { requireAdmin } from '../../../../utils/requireAdmin'

type OutlineItem = { kind: 'chapter' | 'lesson'; id: string }

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const subjectId = getRouterParam(event, 'id')
  if (!subjectId) throw createError({ statusCode: 400, message: 'Missing subject id' })
  const body = await readBody<{ items: OutlineItem[] }>(event)
  if (!Array.isArray(body?.items)) {
    throw createError({ statusCode: 400, message: 'items array is required' })
  }
  const supabase = serverSupabaseService()

  const { data: subject, error: subErr } = await supabase
    .from('subjects')
    .select('id')
    .eq('id', subjectId)
    .single()
  if (subErr || !subject) throw createError({ statusCode: 404, message: 'Subject not found' })

  const { data: allChapters } = await supabase.from('chapters').select('id').eq('subject_id', subjectId)
  const chapterSet = new Set((allChapters ?? []).map(c => c.id))

  const { data: allSubLessons } = await supabase
    .from('lessons')
    .select('id')
    .eq('subject_id', subjectId)
    .is('chapter_id', null)
  const lessonSet = new Set((allSubLessons ?? []).map(l => l.id))

  if (body.items.length !== chapterSet.size + lessonSet.size) {
    throw createError({ statusCode: 400, message: 'items must include every chapter and subject-level lesson for this subject' })
  }

  const seenCh = new Set<string>()
  const seenLe = new Set<string>()
  for (const it of body.items) {
    if (it.kind === 'chapter') {
      if (!chapterSet.has(it.id) || seenCh.has(it.id)) {
        throw createError({ statusCode: 400, message: 'Invalid or duplicate chapter in outline' })
      }
      seenCh.add(it.id)
    } else {
      if (!lessonSet.has(it.id) || seenLe.has(it.id)) {
        throw createError({ statusCode: 400, message: 'Invalid or duplicate lesson in outline' })
      }
      seenLe.add(it.id)
    }
  }
  if (seenCh.size !== chapterSet.size || seenLe.size !== lessonSet.size) {
    throw createError({ statusCode: 400, message: 'Outline must reference exactly the expected chapters and lessons' })
  }

  const { error: delErr } = await supabase.from('subject_outline_items').delete().eq('subject_id', subjectId)
  if (delErr) {
    console.error('[outline-reorder] delete', delErr.message)
    throw createError({ statusCode: 500, message: 'Failed to reset outline' })
  }

  for (let i = 0; i < body.items.length; i++) {
    const it = body.items[i]!
    const row = it.kind === 'chapter'
      ? { subject_id: subjectId, position: i, chapter_id: it.id, lesson_id: null as string | null }
      : { subject_id: subjectId, position: i, chapter_id: null as string | null, lesson_id: it.id }
    const { error: insErr } = await supabase.from('subject_outline_items').insert(row)
    if (insErr) {
      console.error('[outline-reorder] insert', insErr.message)
      throw createError({ statusCode: 500, message: 'Failed to save outline' })
    }
    if (it.kind === 'chapter') {
      const { error: u } = await supabase.from('chapters').update({ order: i }).eq('id', it.id)
      if (u) throw createError({ statusCode: 500, message: 'Failed to sync chapter order' })
    } else {
      const { error: u } = await supabase.from('lessons').update({ order: i }).eq('id', it.id)
      if (u) throw createError({ statusCode: 500, message: 'Failed to sync lesson order' })
    }
  }

  return { ok: true }
})
