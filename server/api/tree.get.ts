import { serverSupabaseAnon } from '../utils/supabaseServer'

function missing(): never {
  throw createError({ statusCode: 404, message: 'Δεν βρέθηκε' })
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const supabase = serverSupabaseAnon()

  if (query.category) {
    const { data: category, error } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', String(query.category))
      .maybeSingle()
    if (error) throw createError({ statusCode: 500, message: 'Κάτι πήγε στραβά' })
    if (!category) missing()
    if (!query.lesson) return { category }
    const { data: placement, error: lessonError } = await supabase
      .from('lesson_placements')
      .select('lessons!inner(id, slug)')
      .eq('category_id', category.id)
      .eq('lessons.slug', String(query.lesson))
      .limit(1)
      .maybeSingle()
    if (lessonError) throw createError({ statusCode: 500, message: 'Κάτι πήγε στραβά' })
    const lesson = Array.isArray(placement?.lessons) ? placement?.lessons[0] : placement?.lessons
    if (!lesson) missing()
    return { category, lesson }
  }

  if (!query.grade) throw createError({ statusCode: 400, message: 'Λείπει η τάξη' })
  const { data: grade, error: gradeError } = await supabase
    .from('grades')
    .select('*')
    .eq('slug', String(query.grade))
    .maybeSingle()
  if (gradeError) throw createError({ statusCode: 500, message: 'Κάτι πήγε στραβά' })
  if (!grade) missing()
  if (!query.subject) return { grade }

  const { data: subject, error: subjectError } = await supabase
    .from('subjects')
    .select('*')
    .eq('grade_id', grade.id)
    .eq('slug', String(query.subject))
    .maybeSingle()
  if (subjectError) throw createError({ statusCode: 500, message: 'Κάτι πήγε στραβά' })
  if (!subject) missing()

  if (String(query.placement || '') === 'subject') {
    const { data: placement, error: lessonError } = await supabase
      .from('lesson_placements')
      .select('lessons!inner(id, slug)')
      .eq('subject_id', subject.id)
      .eq('lessons.slug', String(query.lesson || ''))
      .limit(1)
      .maybeSingle()
    if (lessonError) throw createError({ statusCode: 500, message: 'Κάτι πήγε στραβά' })
    const lesson = Array.isArray(placement?.lessons) ? placement?.lessons[0] : placement?.lessons
    if (!lesson) missing()
    return { grade, subject, lesson }
  }

  if (!query.chapter) return { grade, subject }
  const { data: chapter, error: chapterError } = await supabase
    .from('chapters')
    .select('*')
    .eq('subject_id', subject.id)
    .eq('slug', String(query.chapter))
    .maybeSingle()
  if (chapterError) throw createError({ statusCode: 500, message: 'Κάτι πήγε στραβά' })
  if (!chapter) missing()
  if (!query.lesson) return { grade, subject, chapter }

  const { data: placement, error: lessonError } = await supabase
    .from('lesson_placements')
    .select('lessons!inner(id, slug)')
    .eq('chapter_id', chapter.id)
    .eq('lessons.slug', String(query.lesson))
    .limit(1)
    .maybeSingle()
  if (lessonError) throw createError({ statusCode: 500, message: 'Κάτι πήγε στραβά' })
  const lesson = Array.isArray(placement?.lessons) ? placement?.lessons[0] : placement?.lessons
  if (!lesson) missing()
  return { grade, subject, chapter, lesson }
})
