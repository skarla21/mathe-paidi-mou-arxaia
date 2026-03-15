import { serverSupabaseService } from './supabaseServer'

export async function canAccessLesson(
  userId: string | null,
  lessonId: string,
): Promise<{
  allowed: boolean
  lesson?: {
    id: string
    title: string
    content?: string | null
    is_free: boolean
    price: number
    chapter_id: string | null
    subject_id: string | null
    category_id: string | null
    pdf_url?: string | null
  }
  pdf_url?: string | null
}> {
  const supabase = serverSupabaseService()
  const { data: lesson, error: lessonError } = await supabase
    .from('lessons')
    .select('id, title, content, is_free, price, chapter_id, subject_id, category_id, pdf_url')
    .eq('id', lessonId)
    .single()
  if (lessonError || !lesson) return { allowed: false }
  if (lesson.is_free) return { allowed: true, lesson, pdf_url: lesson.pdf_url }
  if (!userId) return { allowed: false, lesson }
  const { data: purchase } = await supabase
    .from('purchases')
    .select('id')
    .eq('user_id', userId)
    .eq('lesson_id', lessonId)
    .limit(1)
    .single()
  const allowed = !!purchase
  return { allowed, lesson, pdf_url: allowed ? lesson.pdf_url : null }
}
