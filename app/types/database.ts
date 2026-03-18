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
  order: number
  /** Joined relation — only present when select includes `grades(…)` */
  grades?: { name: string } | null
}

export interface Category {
  id: string
  name: string
  description: string | null
  order: number
  created_at: string
}

export interface Chapter {
  id: string
  title: string
  description: string | null
  grade_id: string
  subject_id: string
  thumbnail_url: string | null
  order: number
  created_at: string
  /** Joined relation — only present when select includes `subjects(…)` */
  subjects?: { name: string; grades?: { name: string } | null } | null
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
  chapters?: { title: string; grade_id?: string; subject_id?: string } | null
  subjects?: { name: string; grade_id?: string } | null
  categories?: { name: string } | null
}

export interface User {
  id: string
  email: string | null
  name: string | null
  avatar_url: string | null
  isAdmin: boolean
  email_verified: boolean
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
  // Existing fields
  totalUsers: number
  totalLessons: number
  downloads: number
  revenue: number
  recentDownloads: {
    id: string
    downloaded_at: string
    users?: { name: string | null } | null
    lessons?: { title: string } | null
  }[]
  topLessons: {
    lesson_id: string
    title: string
    count: number
  }[]

  // Extended fields
  totalGrades: number
  totalSubjects: number
  totalChapters: number
  totalCategories: number
  totalPurchases: number
  freeVsPaid: { free: number; paid: number }
  newUsersThisMonth: number
  newUsersLastMonth: number
  downloadsThisMonth: number
  downloadsLastMonth: number
  revenueThisMonth: number
  revenueLastMonth: number
  recentPurchases: {
    id: string
    created_at: string
    users?: { name: string | null; email: string | null } | null
    lessons?: { title: string; price: number } | null
  }[]
  recentUsers: {
    id: string
    name: string | null
    email: string | null
    avatar_url: string | null
    created_at: string
  }[]
  lessonsByGrade: {
    grade: string
    count: number
  }[]
}
