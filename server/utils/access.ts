import { serverSupabaseService } from './supabaseServer'

export async function canAccessLesson(
  userId: string | null,
  lessonId: string,
  emailVerified = false,
): Promise<{
  allowed: boolean
  canAccessContent: boolean
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
  if (lessonError || !lesson) return { allowed: false, canAccessContent: false }

  let hasPurchase = false
  if (userId) {
    const { data } = await supabase
      .from('purchases')
      .select('id')
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .limit(1)
      .maybeSingle()
    hasPurchase = !!data
  }

  const allowed = lesson.is_free || hasPurchase
  const canAccessContent = allowed && !!userId && emailVerified
  const pdf_url = canAccessContent ? lesson.pdf_url : null

  return { allowed, canAccessContent, lesson, pdf_url }
}
