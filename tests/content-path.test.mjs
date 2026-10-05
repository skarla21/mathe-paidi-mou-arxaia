import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { chapterPublicPath, lessonPathFromPlacement } from '../server/utils/contentPath.ts'

describe('lessonPathFromPlacement', () => {
  it('prefers a chapter path over a subject or category path', () => {
    const path = lessonPathFromPlacement({
      lesson_id: 'l1',
      order: 0,
      chapter_id: 'c1',
      subject_id: 's1',
      category_id: 'k1',
      lessons: { slug: 'keimeno' },
      chapters: { slug: 'enotita', subjects: { slug: 'archaia', grades: { slug: 'a-lykeiou' } } },
      subjects: { slug: 'archaia', grades: { slug: 'a-lykeiou' } },
      categories: { slug: 'extra' },
    })
    assert.equal(path, '/a-lykeiou/archaia/enotita/keimeno')
  })

  it('uses the subject lesson route when there is no chapter', () => {
    const path = lessonPathFromPlacement({
      lesson_id: 'l1',
      order: 1,
      chapter_id: null,
      subject_id: 's1',
      category_id: null,
      lessons: { slug: 'keimeno' },
      chapters: null,
      subjects: { slug: 'archaia', grades: { slug: 'a-lykeiou' } },
      categories: null,
    })
    assert.equal(path, '/a-lykeiou/archaia/lesson/keimeno')
  })

  it('uses the category route when that is the only placement', () => {
    const path = lessonPathFromPlacement({
      lesson_id: 'l1',
      order: 0,
      chapter_id: null,
      subject_id: null,
      category_id: 'k1',
      lessons: { slug: 'keimeno' },
      chapters: null,
      subjects: null,
      categories: { slug: 'extra' },
    })
    assert.equal(path, '/category/extra/keimeno')
  })

  it('returns null when a slug in the chain is missing', () => {
    assert.equal(lessonPathFromPlacement({
      lesson_id: 'l1',
      order: 0,
      chapter_id: 'c1',
      subject_id: null,
      category_id: null,
      lessons: { slug: 'keimeno' },
      chapters: { slug: null, subjects: { slug: 'archaia', grades: { slug: 'a-lykeiou' } } },
      subjects: null,
      categories: null,
    }), null)
  })
})

describe('chapterPublicPath', () => {
  it('builds the nested grade path', () => {
    assert.equal(
      chapterPublicPath({ slug: 'enotita', subjects: { slug: 'archaia', grades: { slug: 'a-lykeiou' } } }),
      '/a-lykeiou/archaia/enotita',
    )
  })

  it('returns null when the grade slug is missing', () => {
    assert.equal(
      chapterPublicPath({ slug: 'enotita', subjects: { slug: 'archaia', grades: { slug: null } } }),
      null,
    )
  })
})
