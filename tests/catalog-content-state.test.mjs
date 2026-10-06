import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { catalogContentState } from '../app/utils/catalogContentState.ts'

const idle = {
  chapterCount: 0,
  lessonCount: 0,
  chaptersPending: false,
  lessonsPending: false,
  chaptersError: false,
  lessonsError: false,
}

describe('catalogContentState', () => {
  it('shows one spinner while both requests are still open', () => {
    const state = catalogContentState({
      ...idle,
      chaptersPending: true,
      lessonsPending: true,
    })
    assert.equal(state.showInitialLoading, true)
    assert.equal(state.showChapters, false)
    assert.equal(state.showLessons, false)
    assert.equal(state.chaptersPending, false)
    assert.equal(state.lessonsPending, false)
    assert.equal(state.showEmpty, false)
  })

  it('keeps loaded chapters visible while lessons are still loading', () => {
    const state = catalogContentState({
      ...idle,
      chapterCount: 2,
      lessonsPending: true,
    })
    assert.equal(state.showInitialLoading, false)
    assert.equal(state.showChapters, true)
    assert.equal(state.lessonsPending, true)
    assert.equal(state.showLessonError, false)
    assert.equal(state.showEmpty, false)
  })

  it('keeps loaded lessons visible while chapters are retried', () => {
    const state = catalogContentState({
      ...idle,
      lessonCount: 1,
      chaptersPending: true,
      chaptersError: true,
    })
    assert.equal(state.showLessons, true)
    assert.equal(state.chaptersPending, true)
    assert.equal(state.showChapterError, false)
    assert.equal(state.showBlockedError, false)
  })

  it('names a lesson failure without hiding chapters', () => {
    const state = catalogContentState({
      ...idle,
      chapterCount: 2,
      lessonsError: true,
    })
    assert.equal(state.showChapters, true)
    assert.equal(state.showLessonError, true)
    assert.equal(state.showBlockedError, false)
    assert.equal(state.showEmpty, false)
  })

  it('names a chapter failure when lessons loaded empty', () => {
    const state = catalogContentState({
      ...idle,
      chaptersError: true,
    })
    assert.equal(state.showChapterError, true)
    assert.equal(state.showBlockedError, false)
    assert.equal(state.showEmpty, false)
  })

  it('uses one message when both requests fail', () => {
    const state = catalogContentState({
      ...idle,
      chaptersError: true,
      lessonsError: true,
    })
    assert.equal(state.showBlockedError, true)
    assert.equal(state.showChapterError, false)
    assert.equal(state.showLessonError, false)
  })

  it('shows the empty state only after both requests settle empty', () => {
    assert.equal(catalogContentState(idle).showEmpty, true)
    assert.equal(catalogContentState({
      ...idle,
      lessonsPending: true,
    }).showEmpty, false)
  })
})
