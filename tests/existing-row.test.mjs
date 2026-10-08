import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { requireExistingRow } from '../server/utils/existingRow.ts'

describe('requireExistingRow', () => {
  it('returns the row when the query succeeded', () => {
    assert.deepEqual(requireExistingRow({ id: '1' }, null, '[test]', 'Δεν βρέθηκε'), { id: '1' })
  })

  it('reports a missing row as not found without logging', () => {
    const errors = []
    const original = console.error
    console.error = (...args) => { errors.push(args) }
    try {
      assert.throws(
        () => requireExistingRow(null, null, '[test]', 'Το μάθημα δεν βρέθηκε'),
        (error) => error.statusCode === 404 && error.message === 'Το μάθημα δεν βρέθηκε',
      )
      assert.deepEqual(errors, [])
    } finally {
      console.error = original
    }
  })

  it('logs a query error and reports a server failure', () => {
    const errors = []
    const original = console.error
    console.error = (...args) => { errors.push(args.map(String).join(' ')) }
    try {
      assert.throws(
        () => requireExistingRow(null, { message: 'db down' }, '[admin/subjects/[id].patch]', 'Το μάθημα δεν βρέθηκε'),
        (error) => error.statusCode === 500 && error.message === 'Κάτι πήγε στραβά',
      )
      assert.equal(errors.some((line) => line.includes('[admin/subjects/[id].patch]') && line.includes('db down')), true)
    } finally {
      console.error = original
    }
  })
})
