import { serverSupabaseService } from '../../../utils/supabaseServer'
import { requireAdmin } from '../../../utils/requireAdmin'
import { normalizeArticleTags } from '../../../utils/articleTags'
import { readingTimeMinutesFromBody } from '../../../utils/readingTime'

const BODY_MAX = 500_000

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Missing id parameter' })
  const body = await readBody<{
    title?: string
    body?: string
    tags?: unknown
    published?: boolean
  }>(event)

  const updates: Record<string, unknown> = {}
  if (body.title !== undefined) {
    const t = body.title.trim()
    if (!t) throw createError({ statusCode: 400, message: 'Title cannot be empty' })
    updates.title = t
  }
  if (body.body !== undefined) {
    if (body.body.length > BODY_MAX) throw createError({ statusCode: 400, message: 'Body is too long' })
    if (body.body.length < 1) throw createError({ statusCode: 400, message: 'Body cannot be empty' })
    updates.body = body.body
    updates.reading_time_minutes = readingTimeMinutesFromBody(body.body)
  }
  if (body.tags !== undefined) updates.tags = normalizeArticleTags(body.tags)
  if (body.published !== undefined) updates.published = Boolean(body.published)

  if (!Object.keys(updates).length) throw createError({ statusCode: 400, message: 'Nothing to update' })

  const supabase = serverSupabaseService()
  const { data, error } = await supabase.from('articles').update(updates).eq('id', id).select().single()
  if (error) {
    console.error('[admin/articles/[id].patch]', error.message)
    throw createError({ statusCode: 500, message: 'Database operation failed' })
  }
  return data
})
