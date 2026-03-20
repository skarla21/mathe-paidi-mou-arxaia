-- Run this in Supabase SQL Editor to create all tables and RLS policies.
-- This is the canonical creation script — drop and recreate for a fresh environment.

-- ─── Tables ─────────────────────────────────────────────────────────────────

-- Users
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text,
  name text,
  avatar_url text,
  "isAdmin" boolean not null default false,
  email_verified boolean not null default false,
  password_hash text,
  provider text not null default 'credentials',
  created_at timestamptz not null default now()
);
create index if not exists users_email_idx on public.users(email);

-- Verification tokens (magic link for email verification)
create table if not exists public.verification_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  token_hash text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists verification_tokens_user_id_idx on public.verification_tokens(user_id);
create index if not exists verification_tokens_expires_at_idx on public.verification_tokens(expires_at);

-- Password reset tokens
create table if not exists public.password_reset_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  token_hash text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists password_reset_tokens_token_hash_idx on public.password_reset_tokens(token_hash);
create index if not exists password_reset_tokens_user_id_idx on public.password_reset_tokens(user_id);
create index if not exists password_reset_tokens_expires_at_idx on public.password_reset_tokens(expires_at);

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
  grade_id uuid not null references public.grades(id) on delete cascade,
  image_url text,
  "order" int not null default 0
);
create index if not exists subjects_grade_id_idx on public.subjects(grade_id);
create index if not exists subjects_order_idx on public.subjects("order");

-- Categories (miscellaneous content groupings, independent of grade/subject tree)
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  image_url text,
  "order" int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists categories_order_idx on public.categories("order");

-- Chapters (renamed from courses — organizational containers, no price)
create table if not exists public.chapters (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  grade_id uuid not null references public.grades(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  image_url text,
  "order" int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists chapters_grade_id_idx on public.chapters(grade_id);
create index if not exists chapters_subject_id_idx on public.chapters(subject_id);
create index if not exists chapters_title_idx on public.chapters(title);

-- Lessons (universal content atom)
-- Lessons are placed into chapters and/or categories via lesson_placements (many-to-many).
create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text,
  is_free boolean not null default true,
  price int not null default 0,
  content_url text,
  created_at timestamptz not null default now()
);
create index if not exists lessons_title_idx on public.lessons(title);

-- Lesson placements (many-to-many: a lesson can appear in multiple chapters and/or categories)
create table if not exists public.lesson_placements (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  chapter_id uuid references public.chapters(id) on delete cascade,
  category_id uuid references public.categories(id) on delete cascade,
  "order" int not null default 0,
  created_at timestamptz not null default now(),
  constraint lesson_placements_parent_check check (
    (chapter_id is not null)::int + (category_id is not null)::int = 1
  )
);
create index if not exists lesson_placements_lesson_id_idx on public.lesson_placements(lesson_id);
create index if not exists lesson_placements_chapter_id_idx on public.lesson_placements(chapter_id);
create index if not exists lesson_placements_category_id_idx on public.lesson_placements(category_id);
create index if not exists lesson_placements_order_idx on public.lesson_placements("order");
create unique index if not exists lesson_placements_chapter_unique
  on public.lesson_placements(lesson_id, chapter_id) where chapter_id is not null;
create unique index if not exists lesson_placements_category_unique
  on public.lesson_placements(lesson_id, category_id) where category_id is not null;

-- Purchases (per-lesson purchases, renamed from course_id to lesson_id)
create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  stripe_session_id text,
  created_at timestamptz not null default now(),
  unique(stripe_session_id)
);
create index if not exists purchases_user_id_idx on public.purchases(user_id);
create index if not exists purchases_lesson_id_idx on public.purchases(lesson_id);
create index if not exists purchases_stripe_session_id_idx on public.purchases(stripe_session_id);

-- Downloads (renamed from lesson_downloads — tracks which lessons a user has downloaded)
create table if not exists public.downloads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  downloaded_at timestamptz not null default now(),
  unique(user_id, lesson_id)
);
create index if not exists downloads_user_id_idx on public.downloads(user_id);
create index if not exists downloads_lesson_id_idx on public.downloads(lesson_id);


-- ─── Row Level Security ─────────────────────────────────────────────────────

alter table public.users enable row level security;
alter table public.grades enable row level security;
alter table public.subjects enable row level security;
alter table public.categories enable row level security;
alter table public.chapters enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_placements enable row level security;
alter table public.purchases enable row level security;
alter table public.downloads enable row level security;

-- Grades & Subjects: public read
create policy "grades_select_all" on public.grades for select using (true);
create policy "subjects_select_all" on public.subjects for select using (true);

-- Categories: public read
create policy "categories_select_all" on public.categories for select using (true);

-- Chapters: public read
create policy "chapters_select_all" on public.chapters for select using (true);

-- Lessons: public read (content access / paid-content gate enforced in app layer)
create policy "lessons_select_all" on public.lessons for select using (true);

-- Lesson placements: public read
create policy "lesson_placements_select_all" on public.lesson_placements for select using (true);

-- Users: own row only
create policy "users_select_own" on public.users for select using (auth.uid() = id);
create policy "users_update_own" on public.users for update using (auth.uid() = id);

-- Purchases: own rows only
create policy "purchases_select_own" on public.purchases for select using (auth.uid() = user_id);

-- Downloads: own rows only
create policy "downloads_select_own" on public.downloads for select using (auth.uid() = user_id);
create policy "downloads_insert_own" on public.downloads for insert with check (auth.uid() = user_id);

-- Note: all admin/server writes use the service role key (supabaseServiceKey),
-- which bypasses RLS entirely. No insert/update/delete policies are needed for anon.

-- ─── Functions (admin stats) ─────────────────────────────────────────────────

create or replace function public.get_top_downloaded_lessons(lim int default 10)
returns table(lesson_id uuid, title text, count bigint)
language sql stable
security definer
as $$
  select d.lesson_id, l.title, count(*)::bigint
  from public.downloads d
  join public.lessons l on l.id = d.lesson_id
  group by d.lesson_id, l.title
  order by count(*) desc
  limit lim;
$$;
