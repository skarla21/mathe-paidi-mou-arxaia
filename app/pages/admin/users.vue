<script setup lang="ts">
import { toast } from 'vue-sonner'
import UiButton from '~/components/ui/Button.vue'
import UiInput from '~/components/ui/Input.vue'
import UiSkeleton from '~/components/ui/Skeleton.vue'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'
import AdminUserDetailModal from '~/components/admin/UserDetailModal.vue'
import type { User } from '~/types/database'

definePageMeta({ layout: 'admin', middleware: 'admin' })
const { t } = useI18n()
const adminFetch = useAdminFetch()
useHead(() => ({ title: `${t('admin.nav')} - ${t('admin.usersTitle')}` }))

type SortColumn = 'name' | 'joinedAt' | 'downloads' | 'purchases'

const users = ref<User[]>([])
const loading = ref(true)
const search = ref('')
const detailUserId = ref<string | null>(null)
const sortBy = ref<SortColumn>('joinedAt')
const sortOrder = ref<'asc' | 'desc'>('desc')

const filteredUsers = computed(() => {
  let list = users.value
  if (search.value) {
    const q = search.value.toLowerCase()
    list = list.filter(u =>
      u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
    )
  }
  const col = sortBy.value
  const asc = sortOrder.value === 'asc'
  return [...list].sort((a, b) => {
    let cmp = 0
    if (col === 'name') {
      const na = (a.name ?? '').toLowerCase()
      const nb = (b.name ?? '').toLowerCase()
      cmp = na.localeCompare(nb)
    } else if (col === 'joinedAt') {
      cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    } else if (col === 'downloads') {
      cmp = (a.downloadCount ?? 0) - (b.downloadCount ?? 0)
    } else {
      cmp = (a.purchaseCount ?? 0) - (b.purchaseCount ?? 0)
    }
    return asc ? cmp : -cmp
  })
})

function setSort(col: SortColumn) {
  if (sortBy.value === col) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = col
    sortOrder.value = col === 'name' ? 'asc' : 'desc'
  }
}

async function fetchUsers() {
  loading.value = true
  try { users.value = await adminFetch<User[]>('/api/admin/users') }
  catch {
    users.value = []
    toast.error(t('common.error'))
  }
  finally { loading.value = false }
}

onMounted(fetchUsers)
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold font-heading">{{ t('admin.usersTitle') }}</h1>
    </div>

    <!-- Search -->
    <div class="relative mb-4">
      <VIcon name="bi-search" class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
      <UiInput v-model="search" :placeholder="t('admin.search')" class="pl-9" />
    </div>

    <!-- Skeleton loading -->
    <template v-if="loading">
      <div class="border overflow-x-auto">
        <Table class="text-base">
          <TableHeader>
            <TableRow>
              <TableHead v-for="i in 6" :key="i"><UiSkeleton class="h-4 w-20" /></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="i in 5" :key="i">
              <TableCell v-for="j in 6" :key="j"><UiSkeleton class="h-4 w-full" /></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </template>

    <!-- Data table -->
    <template v-else>
      <div class="border overflow-x-auto">
        <Table class="text-base">
          <TableHeader>
            <TableRow class="bg-muted/80 hover:bg-muted/80 border-b border-border/60">
              <TableHead class="border-r border-border/60 pr-3">
                <button
                  type="button"
                  class="inline-flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer w-full text-left"
                  :aria-label="`${t('admin.field.name')} ${sortBy === 'name' ? t(sortOrder === 'asc' ? 'admin.sortAsc' : 'admin.sortDesc') : ''}`"
                  @click="setSort('name')"
                >
                  {{ t('admin.field.name') }}
                  <VIcon
                    :name="sortBy === 'name' ? (sortOrder === 'asc' ? 'bi-arrow-up-short' : 'bi-arrow-down-short') : 'bi-arrow-down-up'"
                    :class="sortBy === 'name' ? 'size-4 text-foreground shrink-0' : 'size-4 text-muted-foreground/40 shrink-0'"
                  />
                </button>
              </TableHead>
              <TableHead class="border-r border-border/60">{{ t('admin.field.email') }}</TableHead>
              <TableHead class="border-r border-border/60">
                <button
                  type="button"
                  class="inline-flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer w-full text-left"
                  :aria-label="`${t('admin.field.joinedAt')} ${sortBy === 'joinedAt' ? t(sortOrder === 'asc' ? 'admin.sortAsc' : 'admin.sortDesc') : ''}`"
                  @click="setSort('joinedAt')"
                >
                  {{ t('admin.field.joinedAt') }}
                  <VIcon
                    :name="sortBy === 'joinedAt' ? (sortOrder === 'asc' ? 'bi-arrow-up-short' : 'bi-arrow-down-short') : 'bi-arrow-down-up'"
                    :class="sortBy === 'joinedAt' ? 'size-4 text-foreground shrink-0' : 'size-4 text-muted-foreground/40 shrink-0'"
                  />
                </button>
              </TableHead>
              <TableHead class="text-center border-r border-border/60">
                <button
                  type="button"
                  class="inline-flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer mx-auto"
                  :aria-label="`${t('admin.field.downloads')} ${sortBy === 'downloads' ? t(sortOrder === 'asc' ? 'admin.sortAsc' : 'admin.sortDesc') : ''}`"
                  @click="setSort('downloads')"
                >
                  {{ t('admin.field.downloads') }}
                  <VIcon
                    :name="sortBy === 'downloads' ? (sortOrder === 'asc' ? 'bi-arrow-up-short' : 'bi-arrow-down-short') : 'bi-arrow-down-up'"
                    :class="sortBy === 'downloads' ? 'size-4 text-foreground shrink-0' : 'size-4 text-muted-foreground/40 shrink-0'"
                  />
                </button>
              </TableHead>
              <TableHead class="text-center border-r border-border/60">
                <button
                  type="button"
                  class="inline-flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer mx-auto"
                  :aria-label="`${t('admin.field.purchases')} ${sortBy === 'purchases' ? t(sortOrder === 'asc' ? 'admin.sortAsc' : 'admin.sortDesc') : ''}`"
                  @click="setSort('purchases')"
                >
                  {{ t('admin.field.purchases') }}
                  <VIcon
                    :name="sortBy === 'purchases' ? (sortOrder === 'asc' ? 'bi-arrow-up-short' : 'bi-arrow-down-short') : 'bi-arrow-down-up'"
                    :class="sortBy === 'purchases' ? 'size-4 text-foreground shrink-0' : 'size-4 text-muted-foreground/40 shrink-0'"
                  />
                </button>
              </TableHead>
              <TableHead class="text-right" />
            </TableRow>
          </TableHeader>
          <TableBody>
            <!-- Empty state -->
            <TableRow v-if="!filteredUsers.length">
              <TableCell :colspan="6" class="h-32 text-center border-r border-border/60">
                <div class="flex flex-col items-center gap-2 text-muted-foreground">
                  <VIcon name="bi-inbox" class="size-8" />
                  <p>{{ t('admin.usersEmpty') }}</p>
                </div>
              </TableCell>
            </TableRow>
            <!-- Rows -->
            <TableRow v-for="u in filteredUsers" v-else :key="u.id">
              <TableCell class="border-r border-border/60">
                <div class="flex items-center gap-2">
                  <img
                    v-if="u.avatar_url"
                    :src="u.avatar_url"
                    :alt="u.name ?? t('admin.field.name')"
                    class="size-7 rounded-full object-cover"
                  >
                  <VIcon v-else name="bi-person-circle" class="size-7 text-muted-foreground" />
                  <span>{{ u.name ?? t('common.empty') }}</span>
                </div>
              </TableCell>
              <TableCell class="text-muted-foreground border-r border-border/60">{{ u.email }}</TableCell>
              <TableCell class="text-muted-foreground border-r border-border/60">
                {{ new Date(u.created_at).toLocaleDateString() }}
              </TableCell>
              <TableCell class="text-center border-r border-border/60">{{ u.downloadCount ?? 0 }}</TableCell>
              <TableCell class="text-center border-r border-border/60">{{ u.purchaseCount ?? 0 }}</TableCell>
              <TableCell class="text-right">
                <UiButton size="sm" variant="outline" @click="detailUserId = u.id">
                  {{ t('admin.userDetails') }}
                </UiButton>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </template>

    <AdminUserDetailModal :open="!!detailUserId" :user-id="detailUserId" @close="detailUserId = null" />
  </div>
</template>
