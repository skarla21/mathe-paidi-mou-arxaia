-- Migration: Replace direct lesson parent FKs with many-to-many lesson_placements junction table.
-- Also removes subject_outline_items table (no more subject-level lessons).

-- ─── Step 1: Create lesson_placements table ──────────────────────────────────

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

-- Partial unique indexes (NULL-safe: only enforce uniqueness where the column is non-null)
create unique index if not exists lesson_placements_chapter_unique
  on public.lesson_placements(lesson_id, chapter_id) where chapter_id is not null;
create unique index if not exists lesson_placements_category_unique
  on public.lesson_placements(lesson_id, category_id) where category_id is not null;

-- RLS: public read, admin writes via service role
alter table public.lesson_placements enable row level security;
create policy "lesson_placements_select_all" on public.lesson_placements for select using (true);


-- ─── Step 2: Migrate existing data ──────────────────────────────────────────

-- Chapter-based lessons → placements
insert into public.lesson_placements (lesson_id, chapter_id, "order")
select id, chapter_id, "order"
from public.lessons
where chapter_id is not null;

-- Category-based lessons → placements
insert into public.lesson_placements (lesson_id, category_id, "order")
select id, category_id, "order"
from public.lessons
where category_id is not null;

-- Subject-level lessons → create catch-all chapters, then place them
-- Uses MAX(order)+1 to place catch-all chapters at the end of the subject's chapter list
with orphan_subjects as (
  select distinct l.subject_id, s.grade_id, s.name
  from public.lessons l
  join public.subjects s on s.id = l.subject_id
  where l.subject_id is not null
    and l.chapter_id is null
),
chapter_max_order as (
  select os.subject_id, coalesce(max(c."order"), -1) + 1 as next_order
  from orphan_subjects os
  left join public.chapters c on c.subject_id = os.subject_id
  group by os.subject_id
),
new_chapters as (
  insert into public.chapters (title, description, grade_id, subject_id, "order")
  select os.name || ' - General', null, os.grade_id, os.subject_id, cmo.next_order
  from orphan_subjects os
  join chapter_max_order cmo on cmo.subject_id = os.subject_id
  returning id, subject_id
)
insert into public.lesson_placements (lesson_id, chapter_id, "order")
select l.id, nc.id, l."order"
from public.lessons l
join new_chapters nc on nc.subject_id = l.subject_id
where l.subject_id is not null
  and l.chapter_id is null;


-- ─── Step 3: Drop old structures ────────────────────────────────────────────

-- Drop subject_outline_items table (cascades RLS + indexes)
drop table if exists public.subject_outline_items;

-- Drop indexes explicitly before dropping columns
drop index if exists lessons_chapter_id_idx;
drop index if exists lessons_subject_id_idx;
drop index if exists lessons_category_id_idx;
drop index if exists lessons_order_idx;

-- Drop constraint and columns from lessons
alter table public.lessons drop constraint if exists lessons_parent_check;
alter table public.lessons drop column if exists chapter_id;
alter table public.lessons drop column if exists subject_id;
alter table public.lessons drop column if exists category_id;
alter table public.lessons drop column if exists "order";
