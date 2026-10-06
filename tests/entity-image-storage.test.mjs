import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  entityImagePathFromUrl,
  reapOrphanEntityImages,
  removeUnusedEntityImage,
} from '../server/utils/entityImageStorage.ts'

const SUPABASE_URL = 'https://proj.supabase.co'
const IMAGE_URL = `${SUPABASE_URL}/storage/v1/object/public/uploads/entity-images/category-cover-abcd1234.png`

function fakeImages(tables, objects, { listError = null } = {}) {
  const removed = []
  function queryFor(rows) {
    const query = {
      select() {
        return query
      },
      not() {
        return query
      },
      order() {
        return query
      },
      range(start, end) {
        return Promise.resolve({
          data: rows.slice(start, end + 1).map((image_url) => ({ image_url })),
          error: null,
        })
      },
    }
    return query
  }
  return {
    removed,
    client: {
      from(table) {
        return queryFor(tables[table] ?? [])
      },
      storage: {
        from() {
          return {
            list(prefix, options = {}) {
              if (prefix !== 'entity-images') {
                return Promise.resolve({ data: [], error: null })
              }
              if (listError) return Promise.resolve({ data: null, error: listError })
              const start = options.offset ?? 0
              const limit = options.limit ?? objects.length
              return Promise.resolve({ data: objects.slice(start, start + limit), error: null })
            },
            remove(paths) {
              removed.push(...paths)
              return Promise.resolve({ error: null })
            },
          }
        },
      },
    },
  }
}

describe('entityImagePathFromUrl', () => {
  it('reads an entity image and ignores another origin', () => {
    assert.equal(entityImagePathFromUrl(IMAGE_URL, SUPABASE_URL), 'entity-images/category-cover-abcd1234.png')
    assert.equal(entityImagePathFromUrl('https://cdn.example/cover.png', SUPABASE_URL), null)
    assert.equal(
      entityImagePathFromUrl(`${SUPABASE_URL}/storage/v1/object/public/uploads/lesson-content/notes.pdf`, SUPABASE_URL),
      null,
    )
  })
})

describe('removeUnusedEntityImage', () => {
  it('keeps an image another record still uses', async () => {
    const supabase = fakeImages({ categories: [IMAGE_URL] }, [])
    await removeUnusedEntityImage(supabase.client, IMAGE_URL, SUPABASE_URL)
    assert.deepEqual(supabase.removed, [])
  })

  it('removes an image no record uses', async () => {
    const supabase = fakeImages({ categories: ['https://cdn.example/cover.png'] }, [])
    await removeUnusedEntityImage(supabase.client, IMAGE_URL, SUPABASE_URL)
    assert.deepEqual(supabase.removed, ['entity-images/category-cover-abcd1234.png'])
  })

  it('removes nothing when a same-origin url cannot be read', async () => {
    const supabase = fakeImages({
      chapters: [`${SUPABASE_URL}/storage/v1/object/public/uploads/lesson-content/notes.pdf`],
    }, [])
    await removeUnusedEntityImage(supabase.client, IMAGE_URL, SUPABASE_URL)
    assert.deepEqual(supabase.removed, [])
  })
})

describe('reapOrphanEntityImages', () => {
  const now = Date.parse('2026-10-06T12:00:00.000Z')
  const staleAt = new Date(now - 16 * 60 * 1000).toISOString()
  const freshAt = new Date(now - 60 * 1000).toISOString()

  it('deletes an old unreferenced image and keeps a referenced or fresh one', async () => {
    const supabase = fakeImages(
      { subjects: [IMAGE_URL], categories: ['https://cdn.example/cover.png'] },
      [
        { name: 'category-cover-abcd1234.png', id: 'kept', created_at: staleAt },
        { name: 'orphan.png', id: 'orphan', created_at: staleAt },
        { name: 'fresh.png', id: 'fresh', created_at: freshAt },
      ],
    )
    await reapOrphanEntityImages(supabase.client, SUPABASE_URL, now)
    assert.deepEqual(supabase.removed, ['entity-images/orphan.png'])
  })

  it('deletes nothing when a saved image url on this project cannot be read', async () => {
    const supabase = fakeImages(
      { categories: [`${SUPABASE_URL}/storage/v1/object/public/uploads/lesson-content/notes.pdf`] },
      [{ name: 'orphan.png', id: 'orphan', created_at: staleAt }],
    )
    await reapOrphanEntityImages(supabase.client, SUPABASE_URL, now)
    assert.deepEqual(supabase.removed, [])
  })
})
