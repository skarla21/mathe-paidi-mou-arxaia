import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'
import {
  downloadsEmptyMessage,
  filterDownloads,
  LESSON_TYPE_HEADING,
  lessonTypeLabel,
  sortDownloads,
} from '../shared/utils/adminDownloads.mjs'
import { resetAdminMainScroll } from '../shared/utils/adminShell.mjs'
import { ADMIN_DOWNLOADS_PAGE_SIZE, loadAdminDownloads } from '../server/utils/adminDownloads.ts'

const here = dirname(fileURLToPath(import.meta.url))

function read(path) {
  return readFileSync(join(here, path), 'utf8')
}

function row(id, downloadedAt, user, lesson) {
  return {
    id,
    user_id: `user-${id}`,
    lesson_id: `lesson-${id}`,
    downloaded_at: downloadedAt,
    users: user,
    lessons: lesson,
  }
}

const sample = [
  row('1', '2026-01-02T00:00:00.000Z', { name: 'Βάσω', email: 'b@x.gr' }, { title: 'Όμηρος', is_free: true }),
  row('2', '2026-03-01T00:00:00.000Z', { name: 'Άννα', email: 'a@x.gr' }, { title: 'Πλάτων', is_free: false }),
  row('3', '2026-02-01T00:00:00.000Z', { name: null, email: 'z@x.gr' }, { title: null, is_free: true }),
  row('4', '2026-02-01T00:00:00.000Z', { name: 'Άννα', email: 'm@x.gr' }, { title: 'Πλάτων', is_free: false }),
]

function fakeDownloads(rows, { failPage = 0 } = {}) {
  const ranges = []
  const orders = []
  let fromCalls = 0
  const query = {
    select() {
      return query
    },
    order(column, options) {
      orders.push([column, options?.ascending ?? true])
      return query
    },
    range(start, end) {
      ranges.push([start, end])
      if (ranges.length === failPage) {
        return Promise.resolve({ data: null, error: { message: 'db down' } })
      }
      return Promise.resolve({ data: rows.slice(start, end + 1), error: null })
    },
  }
  return {
    ranges,
    orders,
    get fromCalls() {
      return fromCalls
    },
    client: {
      from(table) {
        fromCalls += 1
        assert.equal(table, 'downloads')
        return query
      },
    },
  }
}

const adminEvent = { context: { auth: { userId: 'admin', isAdmin: true } } }

describe('admin downloads list', () => {
  it('rejects a non-admin before querying downloads', async () => {
    const supabase = {
      from() {
        throw new Error('queried')
      },
    }
    await assert.rejects(
      () => loadAdminDownloads({ context: { auth: { userId: 'student', isAdmin: false } } }, supabase),
      (error) => error.statusCode === 403,
    )
    await assert.rejects(
      () => loadAdminDownloads({ context: { auth: null } }, supabase),
      (error) => error.statusCode === 403,
    )
  })

  it('reads every page past the postgrest cap and keeps a stable order', async () => {
    const rows = Array.from({ length: ADMIN_DOWNLOADS_PAGE_SIZE + 1 }, (_, index) => (
      row(String(index), '2026-01-01T00:00:00.000Z', { name: 'Α', email: 'a@x.gr' }, { title: 'Μάθημα', is_free: true })
    ))
    const supabase = fakeDownloads(rows)
    const result = await loadAdminDownloads(adminEvent, supabase.client)
    assert.equal(result.length, ADMIN_DOWNLOADS_PAGE_SIZE + 1)
    assert.deepEqual(supabase.ranges, [
      [0, ADMIN_DOWNLOADS_PAGE_SIZE - 1],
      [ADMIN_DOWNLOADS_PAGE_SIZE, ADMIN_DOWNLOADS_PAGE_SIZE * 2 - 1],
    ])
    assert.deepEqual(supabase.orders, [
      ['downloaded_at', false],
      ['id', true],
      ['downloaded_at', false],
      ['id', true],
    ])
  })

  it('fails the request when a later page fails', async () => {
    const rows = Array.from({ length: ADMIN_DOWNLOADS_PAGE_SIZE + 1 }, (_, index) => (
      row(String(index), '2026-01-01T00:00:00.000Z', null, null)
    ))
    const supabase = fakeDownloads(rows, { failPage: 2 })
    await assert.rejects(
      () => loadAdminDownloads(adminEvent, supabase.client),
      (error) => error.statusCode === 500,
    )
  })

  it('filters by user or lesson and explains an empty table', () => {
    assert.equal(downloadsEmptyMessage(0), 'Δεν υπάρχουν λήψεις ακόμη.')
    assert.equal(downloadsEmptyMessage(4), 'Δεν βρέθηκαν λήψεις.')
    assert.deepEqual(
      filterDownloads(sample, 'άννα', '').map(item => item.id),
      ['2', '4'],
    )
    assert.deepEqual(
      filterDownloads(sample, 'z@x', 'όμηρος').map(item => item.id),
      [],
    )
    assert.deepEqual(
      filterDownloads(sample, '', 'πλά').map(item => item.id),
      ['2', '4'],
    )
  })

  it('sorts by user, lesson, and time', () => {
    assert.deepEqual(sortDownloads(sample, 'user', 'asc').map(item => item.id), ['2', '4', '1', '3'])
    assert.deepEqual(sortDownloads(sample, 'lesson', 'asc').map(item => item.id), ['3', '1', '2', '4'])
    assert.deepEqual(sortDownloads(sample, 'time', 'desc').map(item => item.id), ['2', '3', '4', '1'])
    assert.deepEqual(sortDownloads(sample, 'time', 'asc').map(item => item.id), ['1', '3', '4', '2'])
  })

  it('labels the lesson type as it is now', () => {
    assert.equal(LESSON_TYPE_HEADING, 'Τύπος υλικού')
    assert.equal(lessonTypeLabel(sample[0]), 'Δωρεάν')
    assert.equal(lessonTypeLabel(sample[1]), 'Επί πληρωμή')
    assert.equal(lessonTypeLabel(row('9', '2026-01-01T00:00:00.000Z', null, null)), '—')
  })
})

describe('admin shell', () => {
  it('scrolls the admin main pane back to the top', () => {
    const calls = []
    resetAdminMainScroll({
      scrollTo(x, y) {
        calls.push([x, y])
      },
    })
    resetAdminMainScroll(null)
    assert.deepEqual(calls, [[0, 0]])
  })

  it('lets the mobile menu scroll and resets the main pane on navigation', () => {
    const layout = read('../app/layouts/admin.vue')
    const drawer = layout.match(/v-if="mobileMenuOpen"[\s\S]*?class="([^"]+)"/)
    assert.ok(drawer)
    assert.match(drawer[1], /min-h-0/)
    assert.match(drawer[1], /flex-1/)
    assert.match(drawer[1], /overflow-y-auto/)
    assert.doesNotMatch(drawer[1], /shrink-0/)
    assert.match(layout, /mobileMenuOpen \? 'hidden md:flex' : 'flex'/)
    assert.match(layout, /watch\(\(\) => route\.path/)
    assert.match(layout, /resetAdminMainScroll\(mainEl\.value\)/)
    assert.match(layout, /border-border\/60/)
    assert.doesNotMatch(layout, /border-border(?!\/)/)
  })

  it('asks for every download page and names the current lesson type', () => {
    const route = read('../server/api/admin/downloads.get.ts')
    assert.match(route, /loadAdminDownloads/)
    assert.doesNotMatch(route, /\.select\(/)
    const page = read('../app/pages/admin/downloads.vue')
    assert.match(page, /LESSON_TYPE_HEADING/)
    assert.match(page, /lessonTypeLabel/)
    assert.match(page, /downloadsEmptyMessage/)
    assert.match(page, /filterDownloads/)
    assert.match(page, /sortDownloads/)
    assert.doesNotMatch(page, />Τύπος</)
    assert.match(page, /border-border\/40/)
  })
})
