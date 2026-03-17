<script setup lang="ts">
import { toast } from 'vue-sonner'
import UiButton from '~/components/ui/Button.vue'
import UiInput from '~/components/ui/Input.vue'
import UiSkeleton from '~/components/ui/Skeleton.vue'
import UiSwitch from '~/components/ui/switch/Switch.vue'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'
import UiAlertDialogRoot from '~/components/ui/alert-dialog/AlertDialogRoot.vue'
import UiAlertDialogPortal from '~/components/ui/alert-dialog/AlertDialogPortal.vue'
import UiAlertDialogOverlay from '~/components/ui/alert-dialog/AlertDialogOverlay.vue'
import UiAlertDialogContent from '~/components/ui/alert-dialog/AlertDialogContent.vue'
import UiAlertDialogHeader from '~/components/ui/alert-dialog/AlertDialogHeader.vue'
import UiAlertDialogFooter from '~/components/ui/alert-dialog/AlertDialogFooter.vue'
import UiAlertDialogTitle from '~/components/ui/alert-dialog/AlertDialogTitle.vue'
import UiAlertDialogDescription from '~/components/ui/alert-dialog/AlertDialogDescription.vue'
import UiAlertDialogCancel from '~/components/ui/alert-dialog/AlertDialogCancel.vue'
import UiAlertDialogAction from '~/components/ui/alert-dialog/AlertDialogAction.vue'
import AdminUserDetailModal from '~/components/admin/UserDetailModal.vue'
import type { User } from '~/types/database'

definePageMeta({ layout: 'admin', middleware: 'admin' })
const { t } = useI18n()
useHead(() => ({ title: `${t('admin.nav')} - ${t('admin.usersTitle')}` }))

const users = ref<User[]>([])
const loading = ref(true)
const search = ref('')
const detailUserId = ref<string | null>(null)

// Admin toggle confirmation
const toggleDialogOpen = ref(false)
const pendingToggleUser = ref<User | null>(null)
const toggleLoading = ref(false)

const filteredUsers = computed(() => {
  if (!search.value) return users.value
  const q = search.value.toLowerCase()
  return users.value.filter(u =>
    u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
  )
})

async function fetchUsers() {
  loading.value = true
  try { users.value = await $fetch<User[]>('/api/admin/users') }
  catch {
    users.value = []
    toast.error(t('common.error'))
  }
  finally { loading.value = false }
}

onMounted(fetchUsers)

function requestToggleAdmin(user: User) {
  pendingToggleUser.value = user
  toggleDialogOpen.value = true
}

async function confirmToggleAdmin() {
  const user = pendingToggleUser.value
  if (!user) return
  toggleLoading.value = true
  try {
    await $fetch(`/api/admin/users/${user.id}`, { method: 'PATCH', body: { isAdmin: !user.isAdmin } })
    user.isAdmin = !user.isAdmin
    toast.success(t('admin.isAdminToggleSuccess'))
    toggleDialogOpen.value = false
  } catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    toast.error(err?.data?.message ?? t('common.error'))
  } finally {
    toggleLoading.value = false
    pendingToggleUser.value = null
  }
}
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
      <div class="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead v-for="i in 7" :key="i"><UiSkeleton class="h-4 w-20" /></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="i in 5" :key="i">
              <TableCell v-for="j in 7" :key="j"><UiSkeleton class="h-4 w-full" /></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </template>

    <!-- Data table -->
    <template v-else>
      <div class="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{{ t('admin.field.name') }}</TableHead>
              <TableHead>{{ t('admin.field.email') }}</TableHead>
              <TableHead>{{ t('admin.field.joinedAt') }}</TableHead>
              <TableHead class="text-center">{{ t('admin.field.downloads') }}</TableHead>
              <TableHead class="text-center">{{ t('admin.field.purchases') }}</TableHead>
              <TableHead class="text-center">{{ t('admin.field.isAdmin') }}</TableHead>
              <TableHead class="text-right" />
            </TableRow>
          </TableHeader>
          <TableBody>
            <!-- Empty state -->
            <TableRow v-if="!filteredUsers.length">
              <TableCell :colspan="7" class="h-32 text-center">
                <div class="flex flex-col items-center gap-2 text-muted-foreground">
                  <VIcon name="bi-inbox" class="size-8" />
                  <p>{{ t('admin.usersEmpty') }}</p>
                </div>
              </TableCell>
            </TableRow>
            <!-- Rows -->
            <TableRow v-for="u in filteredUsers" v-else :key="u.id">
              <TableCell>
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
              <TableCell class="text-xs text-muted-foreground">{{ u.email }}</TableCell>
              <TableCell class="text-xs text-muted-foreground">
                {{ new Date(u.created_at).toLocaleDateString() }}
              </TableCell>
              <TableCell class="text-center">{{ u.downloadCount ?? 0 }}</TableCell>
              <TableCell class="text-center">{{ u.purchaseCount ?? 0 }}</TableCell>
              <TableCell class="text-center">
                <UiSwitch
                  :checked="u.isAdmin"
                  :aria-label="t('admin.field.isAdmin')"
                  @update:checked="requestToggleAdmin(u)"
                />
              </TableCell>
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

    <!-- Admin toggle confirmation dialog -->
    <UiAlertDialogRoot v-model:open="toggleDialogOpen">
      <UiAlertDialogPortal>
        <UiAlertDialogOverlay />
        <UiAlertDialogContent>
          <UiAlertDialogHeader>
            <UiAlertDialogTitle>{{ t('admin.confirmAdminToggleTitle') }}</UiAlertDialogTitle>
            <UiAlertDialogDescription>{{ t('admin.confirmAdminToggle') }}</UiAlertDialogDescription>
          </UiAlertDialogHeader>
          <UiAlertDialogFooter>
            <UiAlertDialogCancel>
              <UiButton variant="outline">{{ t('admin.modal.cancel') }}</UiButton>
            </UiAlertDialogCancel>
            <UiAlertDialogAction as-child>
              <UiButton :disabled="toggleLoading" @click="confirmToggleAdmin">
                {{ t('admin.modal.save') }}
              </UiButton>
            </UiAlertDialogAction>
          </UiAlertDialogFooter>
        </UiAlertDialogContent>
      </UiAlertDialogPortal>
    </UiAlertDialogRoot>
  </div>
</template>
