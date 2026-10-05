-- Plain-Greek search key. Keep in step with foldGreekSearch in shared/utils/foldGreekSearch.mjs:
-- NFD, drop combining marks, lowercase, then map final sigma to sigma.

create or replace function public.fold_greek_search(input text)
returns text
language sql
immutable
parallel safe
strict
as $$
  select replace(
    regexp_replace(
      lower(normalize(input, nfd)),
      '[' || chr(768) || '-' || chr(879) || ']',
      '',
      'g'
    ),
    'ς',
    'σ'
  );
$$;

revoke all on function public.fold_greek_search(text) from public, anon, authenticated;
grant execute on function public.fold_greek_search(text) to service_role;

alter table public.chapters
  add column if not exists title_folded text
  generated always as (public.fold_greek_search(title)) stored;

alter table public.lessons
  add column if not exists title_folded text
  generated always as (public.fold_greek_search(title)) stored;

notify pgrst, 'reload schema';
