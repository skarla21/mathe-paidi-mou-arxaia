-- Grade pages live at /:slug, so a grade cannot use a top-level route name.
-- Keep this list aligned with RESERVED_GRADE_SLUGS in shared/utils/slugify.mjs.

create or replace function public.reject_reserved_grade_slug()
returns trigger
language plpgsql
as $$
begin
  if new.slug = any (array[
    'about',
    'admin',
    'api',
    'articles',
    'category',
    'chapter',
    'course',
    'dashboard',
    'grade',
    'lesson',
    'login',
    'notes',
    'profile',
    'register',
    'reset-password'
  ]) then
    raise exception 'reserved grade slug' using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists grades_reject_reserved_slug on public.grades;
create trigger grades_reject_reserved_slug
  before insert or update of slug on public.grades
  for each row execute function public.reject_reserved_grade_slug();

do $$
declare
  reserved constant text[] := array[
    'about',
    'admin',
    'api',
    'articles',
    'category',
    'chapter',
    'course',
    'dashboard',
    'grade',
    'lesson',
    'login',
    'notes',
    'profile',
    'register',
    'reset-password'
  ];
  grade_row record;
  candidate text;
  suffix int;
begin
  for grade_row in
    select id, slug
    from public.grades
    where slug = any (reserved)
    order by "order", id
  loop
    suffix := 2;
    loop
      candidate := grade_row.slug || '-' || suffix;
      exit when not (candidate = any (reserved))
        and not exists (
          select 1
          from public.grades existing
          where existing.slug = candidate
            and existing.id <> grade_row.id
        );
      suffix := suffix + 1;
    end loop;
    update public.grades set slug = candidate where id = grade_row.id;
  end loop;
end $$;
