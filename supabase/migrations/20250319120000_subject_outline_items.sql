-- Run in Supabase SQL Editor on existing projects (additive migration).

create table if not exists public.subject_outline_items (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects(id) on delete cascade,
  position int not null,
  chapter_id uuid references public.chapters(id) on delete cascade,
  lesson_id uuid references public.lessons(id) on delete cascade,
  constraint subject_outline_items_one_child check (
    (chapter_id is not null)::int + (lesson_id is not null)::int = 1
  ),
  constraint subject_outline_items_chapter_unique unique (chapter_id),
  constraint subject_outline_items_lesson_unique unique (lesson_id),
  constraint subject_outline_items_subject_position unique (subject_id, position)
);
create index if not exists subject_outline_items_subject_id_idx on public.subject_outline_items(subject_id);

alter table public.subject_outline_items enable row level security;

drop policy if exists "subject_outline_items_select_all" on public.subject_outline_items;
create policy "subject_outline_items_select_all"
  on public.subject_outline_items for select using (true);

-- Backfill: chapters first (by chapters.order), then subject-level lessons (by lessons.order)
insert into public.subject_outline_items (subject_id, position, chapter_id, lesson_id)
select s.id as subject_id,
       row_number() over (partition by s.id order by c."order" asc, c.id asc) - 1 as position,
       c.id as chapter_id,
       null::uuid as lesson_id
from public.subjects s
join public.chapters c on c.subject_id = s.id
where not exists (
  select 1 from public.subject_outline_items o where o.chapter_id = c.id
);

insert into public.subject_outline_items (subject_id, position, chapter_id, lesson_id)
select l.subject_id,
       coalesce((
         select max(o.position) + 1
         from public.subject_outline_items o
         where o.subject_id = l.subject_id
       ), 0)
       + row_number() over (partition by l.subject_id order by l."order" asc, l.id asc) - 1 as position,
       null::uuid,
       l.id
from public.lessons l
where l.subject_id is not null
  and l.chapter_id is null
  and not exists (
    select 1 from public.subject_outline_items o where o.lesson_id = l.id
  );

-- Renumber positions per subject to be dense 0..n-1
with ranked as (
  select id, subject_id,
         row_number() over (partition by subject_id order by position asc, id asc) - 1 as new_pos
  from public.subject_outline_items
)
update public.subject_outline_items o
set position = r.new_pos
from ranked r
where o.id = r.id;
