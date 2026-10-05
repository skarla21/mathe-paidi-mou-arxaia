import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { notesMenuActive } from '../app/utils/notesMenuActive.ts'

describe('notesMenuActive', () => {
  it('highlights notes and category pages without the catalog', () => {
    assert.equal(notesMenuActive({ path: '/notes', gradeSlugs: [], catalogFailed: false, gradeParam: '' }), true)
    assert.equal(notesMenuActive({ path: '/category/extra', gradeSlugs: [], catalogFailed: false, gradeParam: '' }), true)
    assert.equal(notesMenuActive({ path: '/grade/a-lykeiou', gradeSlugs: [], catalogFailed: false, gradeParam: '' }), true)
  })

  it('highlights a loaded grade slug', () => {
    assert.equal(notesMenuActive({
      path: '/a-lykeiou/archaia',
      gradeSlugs: ['a-lykeiou'],
      catalogFailed: false,
      gradeParam: 'a-lykeiou',
    }), true)
  })

  it('stays inactive on another page and on an unknown grade route', () => {
    assert.equal(notesMenuActive({
      path: '/login',
      gradeSlugs: ['a-lykeiou'],
      catalogFailed: false,
      gradeParam: '',
    }), false)
    assert.equal(notesMenuActive({
      path: '/this-is-not-a-page',
      gradeSlugs: ['a-lykeiou'],
      catalogFailed: false,
      gradeParam: 'this-is-not-a-page',
    }), false)
  })

  it('highlights the grade route when the catalog request failed', () => {
    assert.equal(notesMenuActive({
      path: '/a-lykeiou',
      gradeSlugs: [],
      catalogFailed: true,
      gradeParam: 'a-lykeiou',
    }), true)
    assert.equal(notesMenuActive({
      path: '/login',
      gradeSlugs: [],
      catalogFailed: true,
      gradeParam: '',
    }), false)
  })
})
