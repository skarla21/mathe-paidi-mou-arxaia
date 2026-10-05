import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { lessonContentPathFromUrl, removeUnusedLessonContent } from '../server/utils/lessonStorage.ts'

const SUPABASE_URL = 'https://proj.supabase.co'
const FILE_URL = `${SUPABASE_URL}/storage/v1/object/public/uploads/lesson-content/1-notes.pdf`
const SAME_FILE_WITH_QUERY = `${FILE_URL}?download=notes.pdf`

function fakeSupabase(urls, { removeError = null, listError = null } = {}) {
  const removed = []
  const query = {
    select() {
      return query
    },
    eq(_column, value) {
      if (listError) return Promise.resolve({ count: null, error: listError, data: null })
      const count = urls.filter(url => url === value).length
      return Promise.resolve({ count, error: null, data: null })
    },
    not() {
      return query
    },
    order() {
      return query
    },
    range(start, end) {
      if (listError) return Promise.resolve({ data: null, error: listError })
      return Promise.resolve({
        data: urls.slice(start, end + 1).map(content_url => ({ content_url })),
        error: null,
      })
    },
  }
  return {
    removed,
    client: {
      from() {
        return query
      },
      storage: {
        from() {
          return {
            remove(paths) {
              removed.push(...paths)
              return Promise.resolve({ error: removeError })
            },
          }
        },
      },
    },
  }
}

describe('lessonContentPathFromUrl', () => {
  it('reads a lesson-content key and ignores a query string', () => {
    assert.equal(
      lessonContentPathFromUrl(SAME_FILE_WITH_QUERY, SUPABASE_URL),
      'lesson-content/1-notes.pdf',
    )
  })

  it('rejects another origin, a non-lesson prefix, and path traversal', () => {
    assert.equal(
      lessonContentPathFromUrl('https://evil.example/storage/v1/object/public/uploads/lesson-content/1-notes.pdf', SUPABASE_URL),
      null,
    )
    assert.equal(
      lessonContentPathFromUrl(`${SUPABASE_URL}/storage/v1/object/public/uploads/entity-images/1-notes.pdf`, SUPABASE_URL),
      null,
    )
    assert.equal(
      lessonContentPathFromUrl(`${SUPABASE_URL}/storage/v1/object/public/uploads/lesson-content/../secret.pdf`, SUPABASE_URL),
      null,
    )
    assert.equal(
      lessonContentPathFromUrl(`${SUPABASE_URL}/storage/v1/object/public/uploads/lesson-content/%2e%2e/secret.pdf`, SUPABASE_URL),
      null,
    )
  })
})

describe('removeUnusedLessonContent', () => {
  it('keeps the object when another lesson uses the same storage path', async () => {
    const supabase = fakeSupabase([SAME_FILE_WITH_QUERY])
    await removeUnusedLessonContent(supabase.client, FILE_URL, SUPABASE_URL)
    assert.deepEqual(supabase.removed, [])
  })

  it('keeps the object when the matching lesson is past the first page', async () => {
    const urls = Array.from({ length: 1000 }, (_, index) => (
      `${SUPABASE_URL}/storage/v1/object/public/uploads/lesson-content/other-${index}.pdf`
    ))
    urls.push(SAME_FILE_WITH_QUERY)
    const supabase = fakeSupabase(urls)
    await removeUnusedLessonContent(supabase.client, FILE_URL, SUPABASE_URL)
    assert.deepEqual(supabase.removed, [])
  })

  it('removes the object when no lesson path matches', async () => {
    const supabase = fakeSupabase([
      `${SUPABASE_URL}/storage/v1/object/public/uploads/lesson-content/2-other.pdf`,
    ])
    await removeUnusedLessonContent(supabase.client, FILE_URL, SUPABASE_URL)
    assert.deepEqual(supabase.removed, ['lesson-content/1-notes.pdf'])
  })

  it('does not remove a file when the lesson lookup fails', async () => {
    const supabase = fakeSupabase([FILE_URL], { listError: { message: 'db down' } })
    await removeUnusedLessonContent(supabase.client, FILE_URL, SUPABASE_URL)
    assert.deepEqual(supabase.removed, [])
  })

  it('leaves the saved lesson in place when storage removal fails', async () => {
    const supabase = fakeSupabase([], { removeError: { message: 'storage down' } })
    await removeUnusedLessonContent(supabase.client, FILE_URL, SUPABASE_URL)
    assert.deepEqual(supabase.removed, ['lesson-content/1-notes.pdf'])
  })

  it('skips a url that is not a lesson file in this project', async () => {
    const supabase = fakeSupabase([])
    await removeUnusedLessonContent(supabase.client, 'https://cdn.example/file.pdf', SUPABASE_URL)
    assert.deepEqual(supabase.removed, [])
  })
})
