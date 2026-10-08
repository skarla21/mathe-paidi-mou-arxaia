import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { isFoldedNameConflict, isLessonSlugConflict, isUniqueViolation, withUniqueSlugRetry } from '../server/utils/uniqueViolation.ts'

describe('unique slug writes', () => {
  it('recognizes a postgres unique violation', () => {
    assert.equal(isUniqueViolation({ code: '23505', message: 'duplicate' }), true)
    assert.equal(isUniqueViolation({ code: '23503', message: 'fk' }), false)
    assert.equal(isUniqueViolation(null), false)
  })

  it('recognizes only the lesson slug conflict among unique violations', () => {
    assert.equal(isLessonSlugConflict({ code: '23505', message: 'lesson slug taken' }), true)
    assert.equal(isLessonSlugConflict({ code: '23505', message: 'duplicate key value violates unique constraint' }), false)
  })

  it('recognizes a folded subject or chapter name conflict', () => {
    assert.equal(isFoldedNameConflict({
      code: '23505',
      message: 'duplicate key value violates unique constraint "subjects_grade_name_folded_key"',
    }), true)
    assert.equal(isFoldedNameConflict({
      code: '23505',
      message: 'duplicate key value violates unique constraint "chapters_subject_title_folded_key"',
    }), true)
    assert.equal(isFoldedNameConflict({ code: '23505', message: 'duplicate key value violates unique constraint "subjects_grade_slug_key"' }), false)
    assert.equal(isFoldedNameConflict({ code: '23503', message: 'subjects_grade_name_folded_key' }), false)
  })

  it('does not retry a folded name conflict', async () => {
    let calls = 0
    const result = await withUniqueSlugRetry(3, async () => {
      calls += 1
      return {
        data: null,
        error: {
          code: '23505',
          message: 'duplicate key value violates unique constraint "chapters_subject_title_folded_key"',
        },
      }
    })
    assert.equal(calls, 1)
    assert.equal(result.error?.code, '23505')
  })

  it('retries a unique violation and stops on any other error', async () => {
    let uniqueCalls = 0
    const unique = await withUniqueSlugRetry(3, async () => {
      uniqueCalls += 1
      if (uniqueCalls < 3) return { data: null, error: { code: '23505', message: 'duplicate' } }
      return { data: { ok: true }, error: null }
    })
    assert.equal(uniqueCalls, 3)
    assert.deepEqual(unique.data, { ok: true })

    let otherCalls = 0
    const other = await withUniqueSlugRetry(3, async () => {
      otherCalls += 1
      return { data: null, error: { code: '23503', message: 'fk' } }
    })
    assert.equal(otherCalls, 1)
    assert.equal(other.error?.code, '23503')
  })
})
