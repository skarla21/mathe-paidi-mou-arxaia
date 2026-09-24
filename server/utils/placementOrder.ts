import type { SupabaseClient } from '@supabase/supabase-js'

export interface PlacementParent {
  subject_id?: string | null
  chapter_id?: string | null
  category_id?: string | null
}

type ParentColumn = 'subject_id' | 'chapter_id' | 'category_id'

function parentOf(p: PlacementParent): { column: ParentColumn; id: string } {
  if (p.subject_id) return { column: 'subject_id', id: p.subject_id }
  if (p.chapter_id) return { column: 'chapter_id', id: p.chapter_id }
  return { column: 'category_id', id: p.category_id! }
}

function sameParent(a: PlacementParent, b: PlacementParent): boolean {
  return Boolean(
    (a.subject_id && a.subject_id === b.subject_id)
    || (a.chapter_id && a.chapter_id === b.chapter_id)
    || (a.category_id && a.category_id === b.category_id),
  )
}

async function nextOrder(
  supabase: SupabaseClient,
  column: ParentColumn,
  id: string,
  assigned: Map<string, number>,
): Promise<number> {
  const key = `${column}:${id}`
  const already = assigned.get(key)
  if (already !== undefined) return already

  const { data, error } = await supabase
    .from('lesson_placements')
    .select('order')
    .eq(column, id)
    .order('order', { ascending: false })
    .limit(1)
  if (error) throw error
  return ((data?.[0]?.order as number | undefined) ?? -1) + 1
}

export async function placementRowsForCreate(
  supabase: SupabaseClient,
  lessonId: string,
  placements: PlacementParent[],
) {
  const assigned = new Map<string, number>()
  const rows = []
  for (const p of placements) {
    const parent = parentOf(p)
    const order = await nextOrder(supabase, parent.column, parent.id, assigned)
    assigned.set(`${parent.column}:${parent.id}`, order + 1)
    rows.push({
      lesson_id: lessonId,
      subject_id: p.subject_id ?? null,
      chapter_id: p.chapter_id ?? null,
      category_id: p.category_id ?? null,
      order,
    })
  }
  return rows
}

export async function placementRowsForUpdate(
  supabase: SupabaseClient,
  lessonId: string,
  placements: PlacementParent[],
  existing: Array<PlacementParent & { order: number }>,
) {
  const assigned = new Map<string, number>()
  const rows = []
  for (const p of placements) {
    const kept = existing.find(row => sameParent(row, p))
    const parent = parentOf(p)
    const order = kept
      ? kept.order
      : await nextOrder(supabase, parent.column, parent.id, assigned)
    if (!kept) assigned.set(`${parent.column}:${parent.id}`, order + 1)
    rows.push({
      lesson_id: lessonId,
      subject_id: p.subject_id ?? null,
      chapter_id: p.chapter_id ?? null,
      category_id: p.category_id ?? null,
      order,
    })
  }
  return rows
}
