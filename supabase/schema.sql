-- Run this in Supabase SQL Editor to create all tables and RLS policies.
-- This is the canonical creation script — drop and recreate for a fresh environment.

-- ─── Tables ────────────────────────────────────────────────────────────────────

-- Users
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text,
  name text,
  avatar_url text,
  "isAdmin" boolean not null default false,
  password_hash text,
  provider text not null default 'credentials',
  created_at timestamptz not null default now()
);

create index if not exists users_email_idx on public.users(email);

-- Grades
create table if not exists public.grades (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  "order" int not null default 0
);

create index if not exists grades_order_idx on public.grades("order");

-- Subjects
create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  grade_id uuid not null references public.grades(id) on delete cascade
);

create index if not exists subjects_grade_id_idx on public.subjects(grade_id);

-- Lesson categories (standalone topics not tied to a course)
create table if not exists public.lesson_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  "order" int not null default 0
);

create index if not exists lesson_categories_order_idx on public.lesson_categories("order");

-- Courses
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  grade_id uuid not null references public.grades(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  is_free boolean not null default true,
  price int not null default 0,
  thumbnail_url text,
  created_at timestamptz not null default now()
);

create index if not exists courses_grade_id_idx on public.courses(grade_id);
create index if not exists courses_subject_id_idx on public.courses(subject_id);
create index if not exists courses_title_idx on public.courses(title);

-- Lessons
-- Each lesson belongs to either a course OR a category (never both, never neither).
create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.courses(id) on delete cascade,
  category_id uuid references public.lesson_categories(id) on delete cascade,
  title text not null,
  content text,
  is_free boolean not null default true,
  pdf_url text,
  "order" int not null default 0,
  created_at timestamptz not null default now(),
  constraint lessons_assignment_check check (
    (course_id is not null and category_id is null) or
    (course_id is null and category_id is not null)
  )
);

create index if not exists lessons_course_id_idx on public.lessons(course_id);
create index if not exists lessons_category_id_idx on public.lessons(category_id);
create index if not exists lessons_title_idx on public.lessons(title);
create index if not exists lessons_order_idx on public.lessons("order");

-- Purchases
create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  stripe_session_id text,
  created_at timestamptz not null default now(),
  unique(stripe_session_id)
);

create index if not exists purchases_user_id_idx on public.purchases(user_id);
create index if not exists purchases_course_id_idx on public.purchases(course_id);
create index if not exists purchases_stripe_session_id_idx on public.purchases(stripe_session_id);

-- Lesson downloads (tracks which lessons a user has downloaded)
create table if not exists public.lesson_downloads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  downloaded_at timestamptz not null default now(),
  unique(user_id, lesson_id)
);

create index if not exists lesson_downloads_user_id_idx on public.lesson_downloads(user_id);
create index if not exists lesson_downloads_lesson_id_idx on public.lesson_downloads(lesson_id);


-- ─── Row Level Security ─────────────────────────────────────────────────────────

alter table public.users enable row level security;
alter table public.grades enable row level security;
alter table public.subjects enable row level security;
alter table public.lesson_categories enable row level security;
alter table public.courses enable row level security;
alter table public.lessons enable row level security;
alter table public.purchases enable row level security;
alter table public.lesson_downloads enable row level security;

-- Grades & Subjects: public read
create policy "grades_select_all" on public.grades for select using (true);
create policy "subjects_select_all" on public.subjects for select using (true);

-- Lesson categories: public read
create policy "lesson_categories_select_all" on public.lesson_categories for select using (true);

-- Courses: public read
create policy "courses_select_all" on public.courses for select using (true);

-- Lessons: public read (PDF access / paid-content gate enforced in app layer)
create policy "lessons_select_all" on public.lessons for select using (true);

-- Users: own row only
create policy "users_select_own" on public.users for select using (auth.uid() = id);
create policy "users_update_own" on public.users for update using (auth.uid() = id);

-- Purchases: own rows only
create policy "purchases_select_own" on public.purchases for select using (auth.uid() = user_id);

-- Lesson downloads: own rows only
create policy "lesson_downloads_select_own" on public.lesson_downloads for select using (auth.uid() = user_id);
create policy "lesson_downloads_insert_own" on public.lesson_downloads for insert with check (auth.uid() = user_id);

-- Note: all admin/server writes use the service role key (supabaseServiceKey),
-- which bypasses RLS entirely. No insert/update/delete policies are needed for anon.
