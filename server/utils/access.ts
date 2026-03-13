import { serverSupabaseService } from './supabaseServer'

export async function canAccessCourse(userId: string | null, courseId: string): Promise<boolean> {
  if (!userId) return false
  const supabase = serverSupabaseService()
  const { data: course } = await supabase.from('courses').select('is_free').eq('id', courseId).single()
  if (!course) return false
  if (course.is_free) return true
  const { data: purchase } = await supabase
    .from('purchases')
    .select('id')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .limit(1)
    .single()
  return !!purchase
}

export async function canAccessLesson(userId: string | null, lessonId: string): Promise<{ allowed: boolean; lesson?: { id: string; title: string; content?: string | null; is_free: boolean; course_id: string; pdf_url?: string | null }; pdf_url?: string | null }> {
  const supabase = serverSupabaseService()
  const { data: lesson, error: lessonError } = await supabase
    .from('lessons')
    .select('id, title, content, is_free, course_id, pdf_url')
    .eq('id', lessonId)
    .single()
  if (lessonError || !lesson) {
    return { allowed: false }
  }
  if (lesson.is_free) {
    return { allowed: true, lesson, pdf_url: lesson.pdf_url }
  }
  if (!userId) return { allowed: false, lesson }
  const allowed = await canAccessCourse(userId, lesson.course_id)
  return {
    allowed,
    lesson,
    pdf_url: allowed ? lesson.pdf_url : null,
  }
}
