-- Migration: Add lesson_ratings and lesson_comments tables
-- Ratings (1-5 stars) and comments are independent — a user can leave either or both.

-- ─── Lesson Ratings ─────────────────────────────────────────────────────────

create table if not exists public.lesson_ratings (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  lesson_id   uuid not null references public.lessons(id) on delete cascade,
  rating      smallint not null check (rating >= 1 and rating <= 5),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique(user_id, lesson_id)
);

create index if not exists lesson_ratings_user_id_idx   on public.lesson_ratings(user_id);
create index if not exists lesson_ratings_lesson_id_idx on public.lesson_ratings(lesson_id);

-- ─── Lesson Comments ────────────────────────────────────────────────────────

create table if not exists public.lesson_comments (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  lesson_id   uuid not null references public.lessons(id) on delete cascade,
  body        text not null check (char_length(body) >= 1 and char_length(body) <= 2000),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique(user_id, lesson_id)
);

create index if not exists lesson_comments_user_id_idx   on public.lesson_comments(user_id);
create index if not exists lesson_comments_lesson_id_idx on public.lesson_comments(lesson_id);

-- ─── RLS ────────────────────────────────────────────────────────────────────
-- App uses @auth/core JWT, NOT Supabase Auth. auth.uid() returns NULL.
-- All mutations use serverSupabaseService() (service role, bypasses RLS).
-- Only public select policies needed — consistent with all other tables.

alter table public.lesson_ratings enable row level security;
alter table public.lesson_comments enable row level security;

create policy "lesson_ratings_select_all"  on public.lesson_ratings  for select using (true);
create policy "lesson_comments_select_all" on public.lesson_comments for select using (true);

-- ─── Auto-update updated_at ─────────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger lesson_ratings_set_updated_at
  before update on public.lesson_ratings
  for each row execute function public.set_updated_at();

create trigger lesson_comments_set_updated_at
  before update on public.lesson_comments
  for each row execute function public.set_updated_at();
