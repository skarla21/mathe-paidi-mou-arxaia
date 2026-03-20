import { serverSupabaseAnon } from '../../../utils/supabaseServer'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Missing lesson id' })

  const query = getQuery(event)
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 50)
  const offset = Math.max(Number(query.offset) || 0, 0)

  const supabase = serverSupabaseAnon()
  const { data, error } = await supabase
    .from('lesson_comments')
    .select('id, body, created_at, updated_at, users(id, name, avatar_url)')
    .eq('lesson_id', id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('[lessons/[id]/comments.get]', error.message)
    throw createError({ statusCode: 500, message: 'Database operation failed' })
  }

  return data ?? []
})
