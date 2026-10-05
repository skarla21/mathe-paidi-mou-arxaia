/** Plain-Greek search key. Keep in step with public.fold_greek_search in supabase/schema.sql. */
const YPOGEGRAMMENI = /[\u0345\u037A]/g
const SPACING_MARKS = /[\u0060\u00A8\u00B4\u0384\u1FBD\u1FBF\u1FC0\u1FFE]/g
const POSTGREST_RESERVED = /[,.:()"]/

export function foldGreekSearch(value) {
  return value
    .normalize('NFD')
    .replace(YPOGEGRAMMENI, 'ι')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/ς/g, 'σ')
    .replace(SPACING_MARKS, '')
}

export function searchLikePattern(value) {
  const like = `%${foldGreekSearch(value).replace(/[\\%_]/g, '\\$&')}%`
  if (!POSTGREST_RESERVED.test(like)) return like
  return `"${like.replace(/[\\"]/g, '\\$&')}"`
}
