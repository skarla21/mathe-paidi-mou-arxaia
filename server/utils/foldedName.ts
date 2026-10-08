import type { SupabaseClient } from '@supabase/supabase-js'
import { createError } from 'h3'
import { foldGreekName } from '#shared/utils/foldGreekSearch.mjs'
import { isFoldedNameConflict } from './uniqueViolation'

export const SUBJECT_NAME_REQUIRED = 'Απαιτείται όνομα'
export const CHAPTER_TITLE_REQUIRED = 'Απαιτείται τίτλος'
export const SUBJECT_NAME_TAKEN = 'Υπάρχει ήδη μάθημα με αυτό το όνομα σε αυτή την τάξη'
export const CHAPTER_TITLE_TAKEN = 'Υπάρχει ήδη κεφάλαιο με αυτόν τον τίτλο σε αυτό το μάθημα'

export type FoldedNameRow = { id: string; label: string; parentId: string }

type SiblingRow = { id: string; name?: string; title?: string }

/** Same key as public.fold_greek_name. Parent scope is the grade or subject. */
export function foldedNameTaken(
  rows: FoldedNameRow[] | null,
  label: string,
  parentId: string,
  exceptId?: string,
): boolean {
  const folded = foldGreekName(label)
  return (rows ?? []).some((row) =>
    row.id !== exceptId
    && row.parentId === parentId
    && foldGreekName(row.label) === folded,
  )
}

async function siblingLabels(
  supabase: SupabaseClient,
  table: 'subjects' | 'chapters',
  labelColumn: 'name' | 'title',
  parentColumn: 'grade_id' | 'subject_id',
  parentId: string,
): Promise<FoldedNameRow[]> {
  const { data, error } = await supabase.from(table).select(`id, ${labelColumn}`).eq(parentColumn, parentId)
  if (error) {
    console.error('[foldedName]', error.message)
    throw createError({ statusCode: 500, message: 'Κάτι πήγε στραβά' })
  }
  return ((data ?? []) as SiblingRow[]).map((row) => ({
    id: row.id,
    label: row[labelColumn] ?? '',
    parentId,
  }))
}

export async function assertSubjectNameAvailable(
  supabase: SupabaseClient,
  name: string,
  gradeId: string,
  exceptId?: string,
): Promise<void> {
  if (!foldGreekName(name)) throw createError({ statusCode: 400, message: SUBJECT_NAME_REQUIRED })
  const rows = await siblingLabels(supabase, 'subjects', 'name', 'grade_id', gradeId)
  if (foldedNameTaken(rows, name, gradeId, exceptId)) {
    throw createError({ statusCode: 409, message: SUBJECT_NAME_TAKEN })
  }
}

export async function assertChapterTitleAvailable(
  supabase: SupabaseClient,
  title: string,
  subjectId: string,
  exceptId?: string,
): Promise<void> {
  if (!foldGreekName(title)) throw createError({ statusCode: 400, message: CHAPTER_TITLE_REQUIRED })
  const rows = await siblingLabels(supabase, 'chapters', 'title', 'subject_id', subjectId)
  if (foldedNameTaken(rows, title, subjectId, exceptId)) {
    throw createError({ statusCode: 409, message: CHAPTER_TITLE_TAKEN })
  }
}

export function rethrowFoldedNameConflict(
  error: { code?: string; message?: string } | null | undefined,
  message: string,
) {
  if (isFoldedNameConflict(error)) throw createError({ statusCode: 409, message })
}
