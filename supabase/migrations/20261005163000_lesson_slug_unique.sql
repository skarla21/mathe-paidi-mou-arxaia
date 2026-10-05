create or replace function public.assert_lesson_slug_available()
returns trigger
language plpgsql
as $$
declare
  conflict boolean;
  lesson_slug text;
begin
  if tg_table_name = 'lessons' then
    if tg_op = 'UPDATE' and new.slug is not distinct from old.slug then
      return new;
    end if;
    if new.slug is null or new.slug = '' then
      return new;
    end if;
    select exists (
      select 1
      from public.lesson_placements mine
      join public.lesson_placements other
        on other.lesson_id <> new.id
       and (
         (mine.chapter_id is not null and other.chapter_id = mine.chapter_id)
         or (mine.subject_id is not null and other.subject_id = mine.subject_id)
         or (mine.category_id is not null and other.category_id = mine.category_id)
       )
      join public.lessons other_lesson on other_lesson.id = other.lesson_id
      where mine.lesson_id = new.id
        and other_lesson.slug = new.slug
    ) into conflict;
    if conflict then
      raise exception 'lesson slug taken' using errcode = '23505';
    end if;
    return new;
  end if;

  select lessons.slug into lesson_slug from public.lessons where lessons.id = new.lesson_id;
  if lesson_slug is null or lesson_slug = '' then
    return new;
  end if;
  select exists (
    select 1
    from public.lesson_placements other
    join public.lessons other_lesson on other_lesson.id = other.lesson_id
    where other.lesson_id <> new.lesson_id
      and other_lesson.slug = lesson_slug
      and (
        (new.chapter_id is not null and other.chapter_id = new.chapter_id)
        or (new.subject_id is not null and other.subject_id = new.subject_id)
        or (new.category_id is not null and other.category_id = new.category_id)
      )
  ) into conflict;
  if conflict then
    raise exception 'lesson slug taken' using errcode = '23505';
  end if;
  return new;
end;
$$;

drop trigger if exists lessons_slug_available on public.lessons;
create trigger lessons_slug_available
  before update of slug on public.lessons
  for each row execute function public.assert_lesson_slug_available();

drop trigger if exists lesson_placements_slug_available on public.lesson_placements;
create trigger lesson_placements_slug_available
  before insert or update of lesson_id, subject_id, chapter_id, category_id
  on public.lesson_placements
  for each row execute function public.assert_lesson_slug_available();
