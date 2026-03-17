<script setup lang="ts">
import { toast } from 'vue-sonner'
import UiButton from '~/components/ui/Button.vue'

definePageMeta({ layout: 'admin', middleware: 'admin' })
const { t } = useI18n()
useHead(() => ({ title: `${t('admin.nav')} - ${t('admin.purchasesTitle')}` }))

interface Purchase {
  id: string
  user_id: string
  lesson_id: string
  stripe_session_id: string | null
  created_at: string
  users?: { name: string | null; email: string | null } | null
  lessons?: { title: string | null } | null
}

const purchases = ref<Purchase[]>([])
const loading = ref(true)
const grantingId = ref<string | null>(null)

async function fetchPurchases() {
  loading.value = true
  try {
    purchases.value = await $fetch<Purchase[]>('/api/admin/purchases')
  } catch {
    purchases.value = []
  } finally {
    loading.value = false
  }
}

onMounted(fetchPurchases)

async function grantAccess(userId: string, lessonId: string) {
  grantingId.value = `${userId}-${lessonId}`
  try {
    await $fetch('/api/admin/purchases/grant', { method: 'POST', body: { userId, lessonId } })
    toast.success(t('admin.grantSuccess'))
    await fetchPurchases()
  } catch {
    toast.error(t('admin.grantError'))
  } finally {
    grantingId.value = null
  }
}

function copyStripeId(value: string | null | undefined) {
  if (!value || !import.meta.client) return
  navigator.clipboard.writeText(value)
  toast.success(t('admin.copiedToClipboard'))
}
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold font-heading mb-6">{{ t('admin.purchasesTitle') }}</h1>
    <p v-if="loading" class="text-muted-foreground">{{ t('common.loading') }}</p>
    <template v-else>
      <!-- Empty state -->
      <div v-if="purchases.length === 0" class="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
        <p class="text-base">{{ t('admin.purchasesTitle') }}</p>
        <p class="text-sm mt-1">{{ t('admin.purchasesEmpty') }}</p>
      </div>

      <!-- Purchases table -->
      <div v-else class="rounded-md border overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="border-b bg-muted/50">
            <tr>
              <th scope="col" class="px-4 py-3 text-left font-medium">{{ t('admin.field.name') }}</th>
              <th scope="col" class="px-4 py-3 text-left font-medium">{{ t('admin.field.lesson') }}</th>
              <th scope="col" class="px-4 py-3 text-left font-medium">{{ t('admin.field.joinedAt') }}</th>
              <th scope="col" class="px-4 py-3 text-left font-medium">{{ t('admin.field.stripeId') }}</th>
              <th scope="col" class="px-4 py-3"/>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in purchases" :key="p.id" class="border-b last:border-0 hover:bg-muted/30">
              <td class="px-4 py-3">
                <div class="font-medium">{{ p.users?.name ?? t('common.empty') }}</div>
                <div class="text-xs text-muted-foreground">{{ p.users?.email }}</div>
              </td>
              <td class="px-4 py-3">{{ p.lessons?.title ?? p.lesson_id }}</td>
              <td class="px-4 py-3 text-xs text-muted-foreground">{{ new Date(p.created_at).toLocaleDateString() }}</td>
              <td
                class="px-4 py-3 text-xs text-muted-foreground font-mono cursor-pointer hover:text-primary"
                :title="p.stripe_session_id ?? undefined"
                @click="copyStripeId(p.stripe_session_id)"
              >
                {{ p.stripe_session_id ? p.stripe_session_id.slice(0, 16) + '…' : t('common.empty') }}
              </td>
              <td class="px-4 py-3 text-right">
                <UiButton
                  size="sm"
                  variant="outline"
                  :disabled="grantingId === `${p.user_id}-${p.lesson_id}`"
                  @click="grantAccess(p.user_id, p.lesson_id)"
                >{{ t('admin.grantAccess') }}</UiButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>
