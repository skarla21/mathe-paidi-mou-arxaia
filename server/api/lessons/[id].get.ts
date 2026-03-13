import { canAccessLesson } from '../../utils/access'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Missing lesson id' })
  const userId = event.context.auth?.userId ?? null
  const { allowed, lesson, pdf_url } = await canAccessLesson(userId, id)
  if (!lesson) throw createError({ statusCode: 404, message: 'Lesson not found' })
  return {
    ...lesson,
    pdf_url: allowed ? pdf_url : null,
    can_access: allowed,
  }
})
