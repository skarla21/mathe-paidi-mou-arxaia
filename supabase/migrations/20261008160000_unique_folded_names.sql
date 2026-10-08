-- Unique plain-Greek names. Same key as foldGreekName in shared/utils/foldGreekSearch.mjs.
-- Subjects are unique within a grade. Chapters are unique within a subject.
-- Does not rename or delete existing rows. Rename the listed duplicates, then run again.

create or replace function public.fold_greek_name(input text)
returns text
language sql
immutable
parallel safe
strict
as $$
  select public.fold_greek_search(
    btrim(
      regexp_replace(
        translate(
          translate(
            input,
            chr(8203) || chr(8204) || chr(8205) || chr(8288) || chr(65279),
            ''
          ),
          chr(9) || chr(10) || chr(11) || chr(12) || chr(13) || chr(160) || chr(5760)
            || chr(8192) || chr(8193) || chr(8194) || chr(8195) || chr(8196)
            || chr(8197) || chr(8198) || chr(8199) || chr(8200) || chr(8201) || chr(8202)
            || chr(8232) || chr(8233) || chr(8239) || chr(8287) || chr(12288),
          '                       '
        ),
        ' +',
        ' ',
        'g'
      )
    )
  );
$$;

revoke all on function public.fold_greek_name(text) from public, anon, authenticated;
grant execute on function public.fold_greek_name(text) to service_role;

do $$
declare
  dupes text;
begin
  lock table public.subjects in share row exclusive mode;
  select string_agg(grade_id::text || ': ' || names, '; ' order by grade_id::text)
  into dupes
  from (
    select grade_id, string_agg(distinct name, ', ' order by name) as names
    from public.subjects
    group by grade_id, public.fold_greek_name(name)
    having count(*) > 1
  ) duplicates;
  if dupes is not null then
    raise exception 'Duplicate subject names exist under the same grade. Rename them, then run this migration again: %', dupes;
  end if;
  execute 'create unique index if not exists subjects_grade_name_folded_key on public.subjects (grade_id, (public.fold_greek_name(name)))';
end
$$;

do $$
declare
  dupes text;
begin
  lock table public.chapters in share row exclusive mode;
  select string_agg(subject_id::text || ': ' || titles, '; ' order by subject_id::text)
  into dupes
  from (
    select subject_id, string_agg(distinct title, ', ' order by title) as titles
    from public.chapters
    group by subject_id, public.fold_greek_name(title)
    having count(*) > 1
  ) duplicates;
  if dupes is not null then
    raise exception 'Duplicate chapter titles exist under the same subject. Rename them, then run this migration again: %', dupes;
  end if;
  execute 'create unique index if not exists chapters_subject_title_folded_key on public.chapters (subject_id, (public.fold_greek_name(title)))';
end
$$;
