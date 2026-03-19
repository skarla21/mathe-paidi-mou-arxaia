import type { SupabaseClient } from '@supabase/supabase-js'

async function nextOutlinePosition(supabase: SupabaseClient, subjectId: string): Promise<number> {
  const { data } = await supabase
    .from('subject_outline_items')
    .select('position')
    .eq('subject_id', subjectId)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle()
  return (data?.position as number | undefined ?? -1) + 1
}

export async function appendChapterToOutline(
  supabase: SupabaseClient,
  subjectId: string,
  chapterId: string,
): Promise<void> {
  const pos = await nextOutlinePosition(supabase, subjectId)
  const { error } = await supabase.from('subject_outline_items').insert({
    subject_id: subjectId,
    position: pos,
    chapter_id: chapterId,
    lesson_id: null,
  })
  if (error) throw error
}

export async function appendSubjectLessonToOutline(
  supabase: SupabaseClient,
  subjectId: string,
  lessonId: string,
): Promise<void> {
  const pos = await nextOutlinePosition(supabase, subjectId)
  const { error } = await supabase.from('subject_outline_items').insert({
    subject_id: subjectId,
    position: pos,
    chapter_id: null,
    lesson_id: lessonId,
  })
  if (error) throw error
}

export async function removeLessonOutlineRows(supabase: SupabaseClient, lessonId: string): Promise<void> {
  await supabase.from('subject_outline_items').delete().eq('lesson_id', lessonId)
}

/** After lesson insert/update: keep outline in sync for subject-level lessons only. */
export async function syncLessonOutline(
  supabase: SupabaseClient,
  lessonId: string,
  row: {
    chapter_id: string | null
    subject_id: string | null
    category_id: string | null
  },
): Promise<void> {
  const isSubjectOnly
    = !!row.subject_id && row.chapter_id == null && row.category_id == null
  if (!isSubjectOnly) {
    await removeLessonOutlineRows(supabase, lessonId)
    return
  }
  const { data: existing } = await supabase
    .from('subject_outline_items')
    .select('id, subject_id')
    .eq('lesson_id', lessonId)
    .maybeSingle()
  if (existing?.subject_id === row.subject_id) return
  await removeLessonOutlineRows(supabase, lessonId)
  await appendSubjectLessonToOutline(supabase, row.subject_id!, lessonId)
}
