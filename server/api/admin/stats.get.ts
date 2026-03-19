import { serverSupabaseService } from '../../utils/supabaseServer'
import { requireAdmin } from '../../utils/requireAdmin'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const supabase = serverSupabaseService()

  // ── Date boundaries ──────────────────────────────────────────────────────
  const now = new Date()
  const startOfThisYear = new Date(now.getFullYear(), 0, 1).toISOString()
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()

  // ── Parallel queries ─────────────────────────────────────────────────────
  const [
    usersRes,
    lessonsRes,
    newLessonsThisMonthRes,
    downloadsRes,
    revenueRes,
    recentDownloadsRes,
    topLessonsRes,
    gradesRes,
    subjectsRes,
    chaptersRes,
    categoriesRes,
    purchasesCountRes,
    freeVsPaidRes,
    newUsersThisMonthRes,
    newUsersLastMonthRes,
    newUsersThisYearRes,
    downloadsThisMonthRes,
    downloadsLastMonthRes,
    downloadsThisYearRes,
    revenueThisMonthRes,
    revenueLastMonthRes,
    revenueThisYearRes,
    recentPurchasesRes,
    recentUsersRes,
    lessonsByGradeRes,
  ] = await Promise.all([
    // Existing queries
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('lessons').select('*', { count: 'exact', head: true }),
    supabase
      .from('lessons')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfThisMonth),
    supabase.from('downloads').select('*', { count: 'exact', head: true }),
    supabase.from('purchases').select('lessons(price, is_free)'),
    supabase
      .from('downloads')
      .select('id, downloaded_at, users(name), lessons(title)')
      .order('downloaded_at', { ascending: false })
      .limit(2),
    supabase.rpc('get_top_downloaded_lessons', { lim: 10 }),

    // New count queries
    supabase.from('grades').select('*', { count: 'exact', head: true }),
    supabase.from('subjects').select('*', { count: 'exact', head: true }),
    supabase.from('chapters').select('*', { count: 'exact', head: true }),
    supabase.from('categories').select('*', { count: 'exact', head: true }),
    supabase.from('purchases').select('*', { count: 'exact', head: true }),

    // Free vs paid lesson counts
    supabase.from('lessons').select('is_free'),

    // New users this month / last month / this year
    supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfThisMonth),
    supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfLastMonth)
      .lt('created_at', startOfThisMonth),
    supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfThisYear),

    // Downloads this month / last month / this year
    supabase
      .from('downloads')
      .select('*', { count: 'exact', head: true })
      .gte('downloaded_at', startOfThisMonth),
    supabase
      .from('downloads')
      .select('*', { count: 'exact', head: true })
      .gte('downloaded_at', startOfLastMonth)
      .lt('downloaded_at', startOfThisMonth),
    supabase
      .from('downloads')
      .select('*', { count: 'exact', head: true })
      .gte('downloaded_at', startOfThisYear),

    // Revenue this month
    supabase
      .from('purchases')
      .select('lessons(price, is_free)')
      .gte('created_at', startOfThisMonth),

    // Revenue last month / this year
    supabase
      .from('purchases')
      .select('lessons(price, is_free)')
      .gte('created_at', startOfLastMonth)
      .lt('created_at', startOfThisMonth),
    supabase
      .from('purchases')
      .select('lessons(price, is_free)')
      .gte('created_at', startOfThisYear),

    // Recent purchases with user + lesson info
    supabase
      .from('purchases')
      .select('id, created_at, users(name, email), lessons(title, price)')
      .order('created_at', { ascending: false })
      .limit(2),

    // Recent user signups
    supabase
      .from('users')
      .select('id, name, email, avatar_url, created_at')
      .order('created_at', { ascending: false })
      .limit(2),

    // Lessons by grade via chapters relation
    supabase
      .from('lessons')
      .select('chapters(grade_id, grades(name))')
      .not('chapter_id', 'is', null),
  ])

  // ── Log any query errors (non-blocking) ────────────────────────────────
  const allResults = [
    usersRes, lessonsRes, newLessonsThisMonthRes, downloadsRes, revenueRes, recentDownloadsRes, topLessonsRes,
    gradesRes, subjectsRes, chaptersRes, categoriesRes, purchasesCountRes, freeVsPaidRes,
    newUsersThisMonthRes, newUsersLastMonthRes, newUsersThisYearRes,
    downloadsThisMonthRes, downloadsLastMonthRes, downloadsThisYearRes,
    revenueThisMonthRes, revenueLastMonthRes, revenueThisYearRes,
    recentPurchasesRes, recentUsersRes, lessonsByGradeRes,
  ]
  for (const r of allResults) {
    if (r.error) console.error('[admin/stats]', r.error.message)
  }

  // ── Derive: total revenue (all time) ────────────────────────────────────
  const revenue = (revenueRes.data ?? []).reduce((sum: number, row: unknown) => {
    const lesson = (row as { lessons?: { is_free?: boolean; price?: number } }).lessons
    if (lesson && !lesson.is_free) sum += (lesson.price ?? 0)
    return sum
  }, 0)

  // ── Derive: revenue this month ───────────────────────────────────────────
  const revenueThisMonth = (revenueThisMonthRes.data ?? []).reduce((sum: number, row: unknown) => {
    const lesson = (row as { lessons?: { is_free?: boolean; price?: number } }).lessons
    if (lesson && !lesson.is_free) sum += (lesson.price ?? 0)
    return sum
  }, 0)

  // ── Derive: revenue last month ───────────────────────────────────────────
  const revenueLastMonth = (revenueLastMonthRes.data ?? []).reduce((sum: number, row: unknown) => {
    const lesson = (row as { lessons?: { is_free?: boolean; price?: number } }).lessons
    if (lesson && !lesson.is_free) sum += (lesson.price ?? 0)
    return sum
  }, 0)

  // ── Derive: revenue this year ───────────────────────────────────────────
  const revenueThisYear = (revenueThisYearRes.data ?? []).reduce((sum: number, row: unknown) => {
    const lesson = (row as { lessons?: { is_free?: boolean; price?: number } }).lessons
    if (lesson && !lesson.is_free) sum += (lesson.price ?? 0)
    return sum
  }, 0)

  // ── Derive: free vs paid lesson counts ──────────────────────────────────
  const allLessons = (freeVsPaidRes.data ?? []) as { is_free: boolean }[]
  const freeVsPaid = allLessons.reduce(
    (acc, row) => {
      if (row.is_free) acc.free++
      else acc.paid++
      return acc
    },
    { free: 0, paid: 0 },
  )

  // ── Derive: lessons by grade ─────────────────────────────────────────────
  type LessonByGradeRow = {
    chapters?: {
      grade_id?: string | null
      grades?: { name?: string | null } | null
    } | null
  }
  const gradeCountMap: Record<string, { name: string; count: number }> = {}
  for (const row of (lessonsByGradeRes.data ?? []) as LessonByGradeRow[]) {
    const chapter = row.chapters
    if (!chapter?.grade_id) continue
    const gradeName = chapter.grades?.name ?? chapter.grade_id
    const gid = chapter.grade_id
    if (!gradeCountMap[gid]) {
      gradeCountMap[gid] = { name: gradeName, count: 0 }
    }
    gradeCountMap[gid]!.count++
  }
  const lessonsByGrade = Object.values(gradeCountMap)
    .map(({ name, count }) => ({ grade: name, count }))
    .sort((a, b) => b.count - a.count)

  // ── Derive: topLessons (keep existing fallback logic) ────────────────────
  let topLessons: { lesson_id: string; title: string; count: number }[]
  if (topLessonsRes.error) {
    const { data: fallback } = await supabase
      .from('downloads')
      .select('lesson_id, lessons(title)')
      .limit(500)
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
  }
  else {
    topLessons = (topLessonsRes.data ?? []).map(
      (row: { lesson_id: string; title: string; count: number }) => ({
        lesson_id: row.lesson_id,
        title: row.title,
        count: Number(row.count),
      }),
    )
  }

  // ── Response ─────────────────────────────────────────────────────────────
  return {
    // Existing fields
    totalUsers: usersRes.count ?? 0,
    totalLessons: lessonsRes.count ?? 0,
    downloads: downloadsRes.count ?? 0,
    revenue,
    recentDownloads: recentDownloadsRes.data ?? [],
    topLessons,

    // New fields
    totalGrades: gradesRes.count ?? 0,
    totalSubjects: subjectsRes.count ?? 0,
    totalChapters: chaptersRes.count ?? 0,
    totalCategories: categoriesRes.count ?? 0,
    totalPurchases: purchasesCountRes.count ?? 0,
    newLessonsThisMonth: newLessonsThisMonthRes.count ?? 0,
    freeVsPaid,
    newUsersThisMonth: newUsersThisMonthRes.count ?? 0,
    newUsersLastMonth: newUsersLastMonthRes.count ?? 0,
    newUsersThisYear: newUsersThisYearRes.count ?? 0,
    downloadsThisMonth: downloadsThisMonthRes.count ?? 0,
    downloadsLastMonth: downloadsLastMonthRes.count ?? 0,
    downloadsThisYear: downloadsThisYearRes.count ?? 0,
    revenueThisMonth,
    revenueLastMonth,
    revenueThisYear,
    recentPurchases: recentPurchasesRes.data ?? [],
    recentUsers: recentUsersRes.data ?? [],
    lessonsByGrade,
  }
})
