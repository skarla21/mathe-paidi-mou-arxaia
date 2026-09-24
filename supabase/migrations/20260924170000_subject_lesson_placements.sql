-- Already applied. Do not run again: a later chapter titled "{subject name} - General" would be moved and deleted.
-- Allow a lesson placement to sit directly on a subject.
-- Fold "{subject name} - General" chapters created by the placements migration back onto those subjects.

alter table public.lesson_placements
  add column if not exists subject_id uuid references public.subjects(id) on delete cascade;

alter table public.lesson_placements drop constraint if exists lesson_placements_parent_check;
alter table public.lesson_placements add constraint lesson_placements_parent_check check (
  (subject_id is not null)::int + (chapter_id is not null)::int + (category_id is not null)::int = 1
);

create index if not exists lesson_placements_subject_id_idx on public.lesson_placements(subject_id);
create unique index if not exists lesson_placements_subject_unique
  on public.lesson_placements(lesson_id, subject_id) where subject_id is not null;

update public.lesson_placements lp
set subject_id = c.subject_id,
    chapter_id = null
from public.chapters c
join public.subjects s on s.id = c.subject_id
where lp.chapter_id = c.id
  and c.title = s.name || ' - General';

delete from public.chapters c
using public.subjects s
where c.subject_id = s.id
  and c.title = s.name || ' - General'
  and not exists (
    select 1 from public.lesson_placements lp where lp.chapter_id = c.id
  );
