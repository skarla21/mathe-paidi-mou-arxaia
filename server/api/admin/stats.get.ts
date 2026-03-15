import { serverSupabaseService } from '../../utils/supabaseServer'
import { requireAdmin } from '../../utils/requireAdmin'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const supabase = serverSupabaseService()

  const [usersRes, lessonsRes, downloadsRes, revenueRes, recentDownloadsRes, allDownloadsRes] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('lessons').select('*', { count: 'exact', head: true }),
    supabase.from('downloads').select('*', { count: 'exact', head: true }),
    supabase.from('purchases').select('lessons(price, is_free)'),
    supabase.from('downloads')
      .select('id, downloaded_at, users(name), lessons(title)')
      .order('downloaded_at', { ascending: false })
      .limit(10),
    supabase.from('downloads').select('lesson_id, lessons(title)').limit(500),
  ])

  const revenue = (revenueRes.data ?? []).reduce((sum: number, row: any) => {
    if (!row.lessons?.is_free) sum += (row.lessons?.price ?? 0)
    return sum
  }, 0)

  const lessonCounts: Record<string, { count: number; title: string }> = {}
  for (const d of (allDownloadsRes.data ?? [])) {
    const id = (d as any).lesson_id
    if (!lessonCounts[id]) lessonCounts[id] = { count: 0, title: (d as any).lessons?.title ?? id }
    lessonCounts[id].count++
  }
  const topLessons = Object.entries(lessonCounts)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)
    .map(([id, { count, title }]) => ({ lesson_id: id, title, count }))

  return {
    totalUsers: usersRes.count ?? 0,
    totalLessons: lessonsRes.count ?? 0,
    downloads: downloadsRes.count ?? 0,
    revenue,
    recentDownloads: recentDownloadsRes.data ?? [],
    topLessons,
  }
})
