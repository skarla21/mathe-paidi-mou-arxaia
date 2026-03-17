import { serverSupabaseService } from '../../utils/supabaseServer'
import { requireAdmin } from '../../utils/requireAdmin'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const supabase = serverSupabaseService()

  const [usersRes, lessonsRes, downloadsRes, revenueRes, recentDownloadsRes, topLessonsRes] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('lessons').select('*', { count: 'exact', head: true }),
    supabase.from('downloads').select('*', { count: 'exact', head: true }),
    supabase.from('purchases').select('lessons(price, is_free)'),
    supabase.from('downloads')
      .select('id, downloaded_at, users(name), lessons(title)')
      .order('downloaded_at', { ascending: false })
      .limit(10),
    supabase.rpc('get_top_downloaded_lessons', { lim: 10 }),
  ])

  const revenue = (revenueRes.data ?? []).reduce((sum: number, row: unknown) => {
    const lesson = (row as { lessons?: { is_free?: boolean; price?: number } }).lessons
    if (lesson && !lesson.is_free) sum += (lesson.price ?? 0)
    return sum
  }, 0)

  let topLessons: { lesson_id: string; title: string; count: number }[]
  if (topLessonsRes.error) {
    const { data: fallback } = await supabase.from('downloads').select('lesson_id, lessons(title)').limit(500)
    const lessonCounts: Record<string, { count: number; title: string }> = {}
    for (const d of (fallback ?? [])) {
      const row = d as { lesson_id: string; lessons?: { title?: string } }
      const id = row.lesson_id
      if (!lessonCounts[id]) lessonCounts[id] = { count: 0, title: row.lessons?.title ?? id }
      lessonCounts[id].count++
    }
    topLessons = Object.entries(lessonCounts)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([id, { count, title }]) => ({ lesson_id: id, title, count }))
  } else {
    topLessons = (topLessonsRes.data ?? []).map((row: { lesson_id: string; title: string; count: number }) => ({
      lesson_id: row.lesson_id,
      title: row.title,
      count: Number(row.count),
    }))
  }

  return {
    totalUsers: usersRes.count ?? 0,
    totalLessons: lessonsRes.count ?? 0,
    downloads: downloadsRes.count ?? 0,
    revenue,
    recentDownloads: recentDownloadsRes.data ?? [],
    topLessons,
  }
})
