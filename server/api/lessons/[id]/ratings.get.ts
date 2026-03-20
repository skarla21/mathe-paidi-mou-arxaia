import { serverSupabaseAnon } from '../../../utils/supabaseServer'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Missing lesson id' })

  const supabase = serverSupabaseAnon()
  const { data, error } = await supabase
    .from('lesson_ratings')
    .select('id, rating, created_at, updated_at, users(id, name, avatar_url)')
    .eq('lesson_id', id)
    .order('created_at', { ascending: false })
    .limit(500)

  if (error) {
    console.error('[lessons/[id]/ratings.get]', error.message)
    throw createError({ statusCode: 500, message: 'Database operation failed' })
  }

  const ratings = data ?? []
  const count = ratings.length
  const average = count > 0
    ? Math.round((ratings.reduce((sum, r) => sum + r.rating, 0) / count) * 100) / 100
    : 0

  return { ratings, average, count }
})
