import { canAccessLesson } from '../../utils/access'
import { serverSupabaseService } from '../../utils/supabaseServer'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Missing lesson id' })
  const userId = event.context.auth?.userId ?? null

  let emailVerified = false
  if (userId) {
    const supabase = serverSupabaseService()
    const { data } = await supabase
      .from('users')
      .select('email_verified')
      .eq('id', userId)
      .single()
    emailVerified = !!data?.email_verified
  }

  const { allowed, canAccessContent, lesson, pdf_url } = await canAccessLesson(userId, id, emailVerified)
  if (!lesson) throw createError({ statusCode: 404, message: 'Lesson not found' })
  return {
    ...lesson,
    pdf_url: canAccessContent ? pdf_url : null,
    can_access: allowed,
    can_access_content: canAccessContent,
  }
})
