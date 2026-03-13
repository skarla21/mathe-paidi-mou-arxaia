<script setup lang="ts">
import { toast } from 'vue-sonner'
import UiButton from '~/components/ui/Button.vue'
import AdminUserDetailModal from '~/components/admin/UserDetailModal.vue'

definePageMeta({ layout: 'admin', middleware: 'admin' })
const { t } = useI18n()
useHead(() => ({ title: `${t('admin.nav')} - ${t('admin.usersTitle')}` }))

const users = ref<any[]>([])
const loading = ref(true)
const detailUserId = ref<string | null>(null)

async function fetchUsers() {
  loading.value = true
  try { users.value = await $fetch<any[]>('/api/admin/users') }
  catch { users.value = [] }
  finally { loading.value = false }
}

onMounted(fetchUsers)

async function toggleAdmin(user: any) {
  try {
    await $fetch(`/api/admin/users/${user.id}`, { method: 'PATCH', body: { isAdmin: !user.isAdmin } })
    user.isAdmin = !user.isAdmin
    toast.success(t('admin.isAdminToggleSuccess'))
  } catch (e: any) {
    toast.error(e?.data?.message ?? t('common.error'))
  }
}
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold font-heading mb-6">{{ t('admin.usersTitle') }}</h1>
    <p v-if="loading" class="text-muted-foreground">{{ t('common.loading') }}</p>
    <p v-else-if="!users.length" class="text-muted-foreground">{{ t('admin.usersEmpty') }}</p>
    <div v-else class="rounded-md border overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="border-b bg-muted/50">
          <tr>
            <th class="px-4 py-3 text-left font-medium">{{ t('admin.field.name') }}</th>
            <th class="px-4 py-3 text-left font-medium">{{ t('admin.field.email') }}</th>
            <th class="px-4 py-3 text-left font-medium">{{ t('admin.field.joinedAt') }}</th>
            <th class="px-4 py-3 text-center font-medium">{{ t('admin.field.downloads') }}</th>
            <th class="px-4 py-3 text-center font-medium">{{ t('admin.field.purchases') }}</th>
            <th class="px-4 py-3 text-center font-medium">{{ t('admin.field.isAdmin') }}</th>
            <th class="px-4 py-3"/>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in users" :key="u.id" class="border-b last:border-0 hover:bg-muted/30">
            <td class="px-4 py-3">
              <div class="flex items-center gap-2">
                <img v-if="u.avatar_url" :src="u.avatar_url" class="size-7 rounded-full object-cover" alt="" >
                <VIcon v-else name="bi-person-circle" class="size-7 text-muted-foreground" />
                {{ u.name ?? '—' }}
              </div>
            </td>
            <td class="px-4 py-3 text-xs text-muted-foreground">{{ u.email }}</td>
            <td class="px-4 py-3 text-xs text-muted-foreground">{{ new Date(u.created_at).toLocaleDateString() }}</td>
            <td class="px-4 py-3 text-center">{{ u.downloadCount }}</td>
            <td class="px-4 py-3 text-center">{{ u.purchaseCount }}</td>
            <td class="px-4 py-3 text-center">
              <button
                type="button"
                class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
                :class="u.isAdmin ? 'bg-primary' : 'bg-border'"
                @click="toggleAdmin(u)"
              >
                <span
                  class="inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform"
                  :class="u.isAdmin ? 'translate-x-4' : 'translate-x-1'"
                />
              </button>
            </td>
            <td class="px-4 py-3 text-right">
              <UiButton size="sm" variant="outline" @click="detailUserId = u.id">{{ t('admin.userDetails') }}</UiButton>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <AdminUserDetailModal :open="!!detailUserId" :user-id="detailUserId" @close="detailUserId = null" />
  </div>
</template>
