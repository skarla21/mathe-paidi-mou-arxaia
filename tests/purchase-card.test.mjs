import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import { purchaseCardState } from '../app/utils/purchaseCard.ts'

describe('purchaseCardState', () => {
  it('links a purchase that has a public path', () => {
    assert.deepEqual(purchaseCardState('/a-lykeiou/archaia/enotita/keimeno'), {
      to: '/a-lykeiou/archaia/enotita/keimeno',
      note: null,
    })
  })

  it('explains a purchase that has no public page', () => {
    assert.deepEqual(purchaseCardState(null), {
      to: null,
      note: 'Δεν υπάρχει δημόσια σελίδα για αυτό το υλικό.',
    })
  })

  it('keeps the hover treatment on linked cards only', () => {
    const source = readFileSync(new URL('../app/pages/dashboard.vue', import.meta.url), 'utf8')
    assert.match(source, /purchaseCardState/)
    assert.match(source, /c\.card\.note/)
    assert.match(source, /c\.card\.to \? 'bobble-card/)
  })
})
