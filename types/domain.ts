// types/domain.ts
// Shared domain type definitions derived from supabase/schema.sql.
// Optional joined-data properties reflect actual API response shapes.

// ---------------------------------------------------------------------------
// Core entities (match DB columns 1-to-1)
// ---------------------------------------------------------------------------

export interface Grade {
  id: string
  name: string
  order: number
}

export interface Subject {
  id: string
  name: string
  grade_id: string
}

export interface LessonCategory {
  id: string
  name: string
  order: number
}

export interface Course {
  id: string
  title: string
  description: string | null
  grade_id: string
  subject_id: string
  is_free: boolean
  price: number
  thumbnail_url: string | null
  created_at: string
}

export interface Lesson {
  id: string
  course_id: string | null
  category_id: string | null
  title: string
  content: string | null
  is_free: boolean
  pdf_url: string | null
  order: number
  created_at: string
}

/**
 * Shape returned by GET /api/lessons/[id].
 * Spreads the lesson row and adds access-control fields.
 */
export interface LessonDetail extends Lesson {
  /** Whether the current user may view the PDF */
  can_access: boolean
}

export interface Purchase {
  id: string
  user_id: string
  course_id: string
  stripe_session_id: string | null
  created_at: string
}

/**
 * Shape returned by GET /api/admin/purchases.
 * Supabase join syntax: `select('*, users(name, email), courses(title)')`.
 */
export interface PurchaseWithJoins extends Purchase {
  users: { name: string | null; email: string | null } | null
  courses: { title: string } | null
}

export interface LessonDownload {
  id: string
  user_id: string
  lesson_id: string
  downloaded_at: string
}

// ---------------------------------------------------------------------------
// User (DB row shape -- NOT the auth session user)
// ---------------------------------------------------------------------------

export interface DbUser {
  id: string
  email: string | null
  name: string | null
  avatar_url: string | null
  isAdmin: boolean
  password_hash: string | null
  provider: string
  created_at: string
}
