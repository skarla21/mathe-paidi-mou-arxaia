import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import {
  CHAPTER_TITLE_REQUIRED,
  CHAPTER_TITLE_TAKEN,
  SUBJECT_NAME_REQUIRED,
  SUBJECT_NAME_TAKEN,
  assertChapterTitleAvailable,
  assertSubjectNameAvailable,
  foldedNameTaken,
  rethrowFoldedNameConflict,
} from '../server/utils/foldedName.ts'

const gradeA = 'grade-a'
const gradeB = 'grade-b'
const subjectA = 'subject-a'

describe('foldedNameTaken', () => {
  const siblings = [
    { id: 'subject-1', label: 'Αρχαία', parentId: gradeA },
    { id: 'subject-2', label: 'Λόγος', parentId: gradeB },
  ]

  it('treats capitals, tones, and final sigma as the same name in one parent', () => {
    assert.equal(foldedNameTaken(siblings, 'αρχαία', gradeA), true)
    assert.equal(foldedNameTaken(siblings, 'ἀρχαῖα', gradeA), true)
    assert.equal(foldedNameTaken(siblings, '  ΑΡΧΑΙΑ  ', gradeA), true)
    assert.equal(foldedNameTaken([{ id: 'c1', label: 'λόγος', parentId: subjectA }], 'λόγοσ', subjectA), true)
  })

  it('allows the same folded name under another parent', () => {
    assert.equal(foldedNameTaken(siblings, 'αρχαία', gradeB), false)
    assert.equal(foldedNameTaken(siblings, 'λόγος', gradeA), false)
  })

  it('treats internal whitespace and invisible characters as the same name', () => {
    assert.equal(
      foldedNameTaken([{ id: 's', label: 'Αρχαία Ελληνικά', parentId: gradeA }], 'Αρχαία  Ελληνικά', gradeA),
      true,
    )
    assert.equal(
      foldedNameTaken([{ id: 's', label: 'Αρχαία Ελληνικά', parentId: gradeA }], 'Αρχαία\u00A0Ελληνικά', gradeA),
      true,
    )
    assert.equal(
      foldedNameTaken([{ id: 's', label: 'Αρχαία', parentId: gradeA }], 'Αρχαία\u200B', gradeA),
      true,
    )
  })

  it('allows visible punctuation', () => {
    assert.equal(foldedNameTaken(siblings, 'Αρχαία!', gradeA), false)
  })

  it('excludes the row being edited', () => {
    assert.equal(foldedNameTaken(siblings, 'Αρχαία', gradeA, 'subject-1'), false)
    assert.equal(foldedNameTaken(siblings, 'αρχαία', gradeA, 'other'), true)
  })

  it('treats a missing sibling list as available', () => {
    assert.equal(foldedNameTaken(null, 'Αρχαία', gradeA), false)
  })
})

function siblingClient(rows) {
  const filters = []
  const query = {
    select() { return query },
    eq(name, value) {
      filters.push([name, value])
      return query
    },
    then(resolve, reject) {
      return Promise.resolve({ data: rows, error: null }).then(resolve, reject)
    },
  }
  return {
    filters,
    from() { return query },
  }
}

describe('assertSubjectNameAvailable', () => {
  it('rejects a folded duplicate in the same grade', async () => {
    const supabase = siblingClient([{ id: 'subject-1', name: 'Αρχαία' }])
    await assert.rejects(
      () => assertSubjectNameAvailable(supabase, 'αρχαία', gradeA),
      (error) => error.statusCode === 409 && error.message === SUBJECT_NAME_TAKEN,
    )
    assert.deepEqual(supabase.filters, [['grade_id', gradeA]])
  })

  it('allows saving the same subject', async () => {
    const supabase = siblingClient([{ id: 'subject-1', name: 'Αρχαία' }])
    await assertSubjectNameAvailable(supabase, 'ἀρχαῖα', gradeA, 'subject-1')
  })

  it('rejects a blank or accent-only name before reading siblings', async () => {
    const supabase = siblingClient([{ id: 'subject-1', name: 'Αρχαία' }])
    await assert.rejects(
      () => assertSubjectNameAvailable(supabase, '   ', gradeA),
      (error) => error.statusCode === 400 && error.message === SUBJECT_NAME_REQUIRED,
    )
    await assert.rejects(
      () => assertSubjectNameAvailable(supabase, '΄', gradeA),
      (error) => error.statusCode === 400 && error.message === SUBJECT_NAME_REQUIRED,
    )
    assert.deepEqual(supabase.filters, [])
  })

  it('logs and rejects when the sibling query fails', async () => {
    const errors = []
    const original = console.error
    console.error = (...args) => { errors.push(args.map(String).join(' ')) }
    try {
      const supabase = {
        from() {
          return {
            select() { return this },
            eq() { return this },
            then(resolve, reject) {
              return Promise.resolve({ data: null, error: { message: 'db down' } }).then(resolve, reject)
            },
          }
        },
      }
      await assert.rejects(
        () => assertSubjectNameAvailable(supabase, 'Αρχαία', gradeA),
        (error) => error.statusCode === 500 && error.message === 'Κάτι πήγε στραβά',
      )
      assert.equal(errors.some((line) => line.includes('db down')), true)
    } finally {
      console.error = original
    }
  })
})

describe('assertChapterTitleAvailable', () => {
  it('rejects a folded duplicate in the same subject', async () => {
    const supabase = siblingClient([{ id: 'chapter-1', title: 'λόγος' }])
    await assert.rejects(
      () => assertChapterTitleAvailable(supabase, 'ΛΟΓΟΣ', subjectA),
      (error) => error.statusCode === 409 && error.message === CHAPTER_TITLE_TAKEN,
    )
    assert.deepEqual(supabase.filters, [['subject_id', subjectA]])
  })

  it('allows saving the same chapter', async () => {
    const supabase = siblingClient([{ id: 'chapter-1', title: 'λόγος' }])
    await assertChapterTitleAvailable(supabase, 'λόγοσ', subjectA, 'chapter-1')
  })

  it('rejects a blank title before reading siblings', async () => {
    const supabase = siblingClient([])
    await assert.rejects(
      () => assertChapterTitleAvailable(supabase, ' \u00A0 ', subjectA),
      (error) => error.statusCode === 400 && error.message === CHAPTER_TITLE_REQUIRED,
    )
    assert.deepEqual(supabase.filters, [])
  })
})

describe('rethrowFoldedNameConflict', () => {
  it('turns a folded name violation into a conflict and ignores other errors', () => {
    assert.throws(
      () => rethrowFoldedNameConflict({
        code: '23505',
        message: 'duplicate key value violates unique constraint "chapters_subject_title_folded_key"',
      }, CHAPTER_TITLE_TAKEN),
      (error) => error.statusCode === 409 && error.message === CHAPTER_TITLE_TAKEN,
    )
    assert.doesNotThrow(() => rethrowFoldedNameConflict(
      { code: '23505', message: 'duplicate key value violates unique constraint "subjects_grade_slug_key"' },
      SUBJECT_NAME_TAKEN,
    ))
    assert.doesNotThrow(() => rethrowFoldedNameConflict(null, SUBJECT_NAME_TAKEN))
  })
})

function foldedNameSql(sql) {
  const start = sql.indexOf('-- Unique plain-Greek names.')
  assert.notEqual(start, -1)
  const marker = 'create unique index if not exists chapters_subject_title_folded_key'
  const markerAt = sql.indexOf(marker, start)
  assert.notEqual(markerAt, -1)
  const tail = sql.slice(markerAt).match(/create unique index if not exists chapters_subject_title_folded_key[\s\S]*?;/)
  assert.ok(tail)
  return sql.slice(start, markerAt) + tail[0]
}

describe('folded name sql', () => {
  it('keeps schema.sql and the migration on the same name key', () => {
    const schema = readFileSync(new URL('../supabase/schema.sql', import.meta.url), 'utf8')
    const migration = readFileSync(new URL('../supabase/migrations/20261008160000_unique_folded_names.sql', import.meta.url), 'utf8')
    const body = foldedNameSql(schema)
    assert.equal(body, foldedNameSql(migration))
    assert.match(body, /function public\.fold_greek_name\(input text\)/)
    assert.match(body, /lock table public\.subjects in share row exclusive mode/i)
    assert.match(body, /lock table public\.chapters in share row exclusive mode/i)
    assert.match(body, /public\.fold_greek_name\(name\)/)
    assert.match(body, /public\.fold_greek_name\(title\)/)
    assert.doesNotMatch(body, /fold_greek_search\(btrim\((name|title)\)/)
    const spaceFrom = body.match(/translate\(\s*translate\([\s\S]*?chr\(65279\),\s*''\s*\),\s*([\s\S]*?),\s*'([ ]*)'\s*\)/)
    assert.ok(spaceFrom)
    const spaceCodes = [...spaceFrom[1].matchAll(/chr\((\d+)\)/g)].map((match) => Number(match[1]))
    assert.equal(spaceFrom[2].length, spaceCodes.length)
    assert.equal(new Set(spaceCodes).size, spaceCodes.length)
  })
})
