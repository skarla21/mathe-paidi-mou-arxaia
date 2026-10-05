-- Plain-Greek search key. Keep in step with foldGreekSearch in shared/utils/foldGreekSearch.mjs:
-- NFD, lowercase, map ypogegrammeni to iota, drop combining marks, map final sigma
-- to sigma, then drop spacing breathings and accents.
-- Stored title_folded values are computed on write, so recompute them after replacing the function.

create or replace function public.fold_greek_search(input text)
returns text
language sql
immutable
parallel safe
strict
as $$
  select translate(
    replace(
      regexp_replace(
        replace(
          replace(
            lower(normalize(input, nfd)),
            chr(837),
            'ι'
          ),
          chr(890),
          'ι'
        ),
        '[' || chr(768) || '-' || chr(879) || ']',
        '',
        'g'
      ),
      'ς',
      'σ'
    ),
    chr(96) || chr(168) || chr(180) || chr(900) || chr(8125) || chr(8127) || chr(8128) || chr(8190),
    ''
  );
$$;

revoke all on function public.fold_greek_search(text) from public, anon, authenticated;
grant execute on function public.fold_greek_search(text) to service_role;

update public.chapters set title = title;
update public.lessons set title = title;

notify pgrst, 'reload schema';
