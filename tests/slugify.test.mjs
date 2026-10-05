import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { chapterSlug, slugifyGreek, stableSlug, uniqueSlug } from '../shared/utils/slugify.mjs'

describe('slugifyGreek', () => {
  it('spells the steady grade names with ELOT 743', () => {
    assert.equal(slugifyGreek("Γ' Δημοτικού"), 'g-dimotikou')
    assert.equal(slugifyGreek("Δ' Δημοτικού"), 'd-dimotikou')
    assert.equal(slugifyGreek("Ε' Δημοτικού"), 'e-dimotikou')
    assert.equal(slugifyGreek("ΣΤ' Δημοτικού"), 'st-dimotikou')
    assert.equal(slugifyGreek("Α' Γυμνασίου"), 'a-gymnasiou')
    assert.equal(slugifyGreek("Β' Γυμνασίου"), 'v-gymnasiou')
    assert.equal(slugifyGreek("Γ' Γυμνασίου"), 'g-gymnasiou')
    assert.equal(slugifyGreek("Α' Λυκείου"), 'a-lykeiou')
    assert.equal(slugifyGreek("Β' Λυκείου"), 'v-lykeiou')
    assert.equal(slugifyGreek("Γ' Λυκείου"), 'g-lykeiou')
  })

  it('slugifies Greek, English, and mixed names', () => {
    assert.equal(slugifyGreek('Αρχαία Ελληνικά'), 'archaia-ellinika')
    assert.equal(slugifyGreek('Γραμματική'), 'grammatiki')
    assert.equal(slugifyGreek('Συντακτικό'), 'syntaktiko')
    assert.equal(slugifyGreek('Ancient Greek Grammar'), 'ancient-greek-grammar')
    assert.equal(slugifyGreek('Lesson Αρχαία'), 'lesson-archaia')
  })

  it('adds a numeric suffix only when the slug is already taken', () => {
    assert.equal(uniqueSlug('lesson1', []), 'lesson1')
    assert.equal(uniqueSlug('lesson1', ['lesson1']), 'lesson1-2')
    assert.equal(uniqueSlug('lesson1', ['lesson1', 'lesson1-2']), 'lesson1-3')
  })
})

describe('stableSlug', () => {
  it('keeps the current slug when it is still free', () => {
    assert.equal(stableSlug('archaia', []), 'archaia')
    assert.equal(stableSlug('archaia', ['grammatiki']), 'archaia')
  })

  it('suffixes the current slug when that exact value is taken', () => {
    assert.equal(stableSlug('archaia', ['archaia']), 'archaia-2')
    assert.equal(stableSlug('archaia', ['archaia', 'archaia-2']), 'archaia-3')
  })
})

describe('chapterSlug', () => {
  it('never uses the reserved lesson segment', () => {
    assert.equal(chapterSlug('lesson', []), 'lesson-2')
    assert.equal(chapterSlug('lesson', ['lesson-2']), 'lesson-3')
    assert.equal(chapterSlug('eisagogi', []), 'eisagogi')
  })
})
