export const LESSON_TYPE_HEADING = 'Τύπος υλικού'

export function downloadsEmptyMessage(storedCount) {
  return storedCount > 0 ? 'Δεν βρέθηκαν λήψεις.' : 'Δεν υπάρχουν λήψεις ακόμη.'
}

export function filterDownloads(rows, userQuery, lessonQuery) {
  const userQ = userQuery.trim().toLowerCase()
  const lessonQ = lessonQuery.trim().toLowerCase()
  return rows.filter((row) => {
    const userMatches = !userQ
      || row.users?.name?.toLowerCase().includes(userQ)
      || row.users?.email?.toLowerCase().includes(userQ)
    const lessonMatches = !lessonQ || !!row.lessons?.title?.toLowerCase().includes(lessonQ)
    return userMatches && lessonMatches
  })
}

function userSortKey(row) {
  const name = row.users?.name?.trim()
  if (name) return name
  return row.users?.email ?? ''
}

export function sortDownloads(rows, column, order) {
  const asc = order === 'asc'
  return [...rows].sort((a, b) => {
    let cmp = 0
    if (column === 'user') {
      cmp = userSortKey(a).localeCompare(userSortKey(b), 'el')
      if (cmp === 0) {
        cmp = (a.users?.email ?? '').localeCompare(b.users?.email ?? '', 'el')
      }
    } else if (column === 'lesson') {
      cmp = (a.lessons?.title ?? '').localeCompare(b.lessons?.title ?? '', 'el')
    } else {
      cmp = new Date(a.downloaded_at).getTime() - new Date(b.downloaded_at).getTime()
    }
    return asc ? cmp : -cmp
  })
}

export function lessonTypeLabel(row) {
  if (!row.lessons) return '—'
  return row.lessons.is_free ? 'Δωρεάν' : 'Επί πληρωμή'
}
