alter table public.grades add column if not exists slug text;
alter table public.subjects add column if not exists slug text;
alter table public.chapters add column if not exists slug text;
alter table public.categories add column if not exists slug text;
alter table public.lessons add column if not exists slug text;

create unique index if not exists grades_slug_key on public.grades (slug);
create unique index if not exists subjects_grade_slug_key on public.subjects (grade_id, slug);
create unique index if not exists chapters_subject_slug_key on public.chapters (subject_id, slug);
create unique index if not exists categories_slug_key on public.categories (slug);
