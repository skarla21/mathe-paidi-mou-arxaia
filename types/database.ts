/** Shared domain types matching the Supabase schema (supabase/schema.sql). */

export interface Grade {
  id: string
  name: string
  order: number
}

export interface Subject {
  id: string
  name: string
  grade_id: string
  image_url?: string | null
  /** Joined relation — only present when select includes `grades(…)` */
  grades?: { name: string } | null
}

export interface Category {
  id: string
  name: string
  description: string | null
  image_url?: string | null
  order: number
  created_at: string
}

export interface Chapter {
  id: string
  title: string
  description: string | null
  grade_id: string
  subject_id: string
  image_url: string | null
  order: number
  created_at: string
  /** Joined relation — only present when select includes `subjects(…)` */
  subjects?: { name: string } | null
}

export interface Lesson {
  id: string
  chapter_id: string | null
  subject_id: string | null
  category_id: string | null
  title: string
  content: string | null
  is_free: boolean
  price: number
  content_url: string | null
  order: number
  created_at: string
  /** Joined relations — present when select includes these */
  chapters?: { title: string } | null
  subjects?: { name: string } | null
  categories?: { name: string } | null
}

export interface User {
  id: string
  email: string | null
  name: string | null
  avatar_url: string | null
  isAdmin: boolean
  email_verified: boolean
  password_hash: string | null
  provider: string
  created_at: string
  /** Aggregated counts — present on admin user listing */
  downloadCount?: number
  purchaseCount?: number
}

export interface Purchase {
  id: string
  user_id: string
  lesson_id: string
  stripe_session_id: string | null
  created_at: string
  /** Joined relation */
  lessons?: { title: string } | null
}

export interface Download {
  id: string
  user_id: string
  lesson_id: string
  downloaded_at: string
  /** Joined relation */
  lessons?: { title: string } | null
}

export interface VerificationToken {
  id: string
  user_id: string
  token_hash: string
  expires_at: string
  created_at: string
}

export interface PasswordResetToken {
  id: string
  user_id: string
  token_hash: string
  expires_at: string
  used_at: string | null
  created_at: string
}

export interface AdminStats {
  totalUsers: number
  totalLessons: number
  downloads: number
  revenue: number
  totalGrades?: number
  totalSubjects?: number
  totalChapters?: number
  totalCategories?: number
  totalPurchases?: number
  newLessonsThisMonth?: number
  newUsersThisMonth?: number
  newUsersThisYear?: number
  downloadsThisMonth?: number
  downloadsThisYear?: number
  revenueThisMonth?: number
  revenueThisYear?: number
  freeVsPaid?: { free: number; paid: number }
  lessonsByGrade?: { grade: string; count: number }[]
  recentDownloads: {
    id: string
    downloaded_at: string
    users?: { name: string | null } | null
    lessons?: { title: string } | null
  }[]
  recentPurchases?: unknown[]
  recentUsers?: unknown[]
  topLessons: {
    lesson_id: string
    title: string
    count: number
  }[]
}
