<script setup lang="ts">
import { toast } from 'vue-sonner'
import UiButton from '~/components/ui/Button.vue'
import UiDialog from '~/components/ui/dialog/Dialog.vue'
import UiDialogPortal from '~/components/ui/dialog/DialogPortal.vue'
import UiDialogOverlay from '~/components/ui/dialog/DialogOverlay.vue'
import UiDialogContent from '~/components/ui/dialog/DialogContent.vue'
import UiDialogHeader from '~/components/ui/dialog/DialogHeader.vue'
import UiDialogTitle from '~/components/ui/dialog/DialogTitle.vue'
import UiDialogDescription from '~/components/ui/dialog/DialogDescription.vue'
import UiLabel from '~/components/ui/Label.vue'
import { Switch } from '~/components/ui/switch'
import type { AdminNotificationItem, AdminNotificationKind } from '~/types/database'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: []; refresh: [] }>()

const { t } = useI18n()
const adminFetch = useAdminFetch()

const loading = ref(false)
const prefsLoading = ref(false)
const items = ref<AdminNotificationItem[]>([])
const unreadCount = ref(0)

const prefs = ref({
  notify_purchase: true,
  notify_download: true,
  notify_rating: true,
  notify_comment: true,
  notify_contact: true,
})

async function loadPrefs() {
  prefsLoading.value = true
  try {
    const p = await adminFetch<typeof prefs.value>('/api/admin/notification-preferences')
    prefs.value = { ...prefs.value, ...p }
  } catch {
    toast.error(t('admin.notifications.loadError'))
  } finally {
    prefsLoading.value = false
  }
}

async function savePrefs() {
  try {
    await adminFetch('/api/admin/notification-preferences', {
      method: 'PUT',
      body: prefs.value,
    })
    await loadList()
    emit('refresh')
  } catch {
    toast.error(t('admin.notifications.savePrefsError'))
  }
}

async function loadList() {
  loading.value = true
  try {
    const res = await adminFetch<{ items: AdminNotificationItem[]; unreadCount: number }>(
      '/api/admin/notifications',
      { query: { limit: 50 } },
    )
    items.value = res.items ?? []
    unreadCount.value = res.unreadCount ?? 0
  } catch {
    toast.error(t('admin.notifications.loadError'))
  } finally {
    loading.value = false
  }
}

watch(
  () => props.open,
  async (open) => {
    if (!open) return
    await Promise.all([loadPrefs(), loadList()])
  },
)

function displayName(payload: Record<string, unknown>) {
  const name = typeof payload.user_name === 'string' ? payload.user_name : ''
  const email = typeof payload.user_email === 'string' ? payload.user_email : ''
  return name || email || t('admin.notifications.anonymousUser')
}

function lineForKind(item: AdminNotificationItem): string {
  const p = item.payload
  const lesson = typeof p.lesson_title === 'string' ? p.lesson_title : ''
  switch (item.kind) {
    case 'purchase':
      return t('admin.notifications.linePurchase', {
        name: displayName(p),
        lesson,
      })
    case 'download':
      return t('admin.notifications.lineDownload', {
        name: displayName(p),
        lesson,
      })
    case 'rating': {
      const r = typeof p.rating === 'number' ? p.rating : ''
      return t('admin.notifications.lineRating', {
        name: displayName(p),
        lesson,
        rating: String(r),
      })
    }
    case 'comment': {
      const ex = typeof p.excerpt === 'string' ? p.excerpt : ''
      return t('admin.notifications.lineComment', {
        name: displayName(p),
        lesson,
        excerpt: ex,
      })
    }
    case 'contact':
      return ''
    default:
      return item.kind
  }
}

function kindLabel(kind: AdminNotificationKind) {
  return t(`admin.notifications.kind.${kind}`)
}

async function markRead(id: string) {
  try {
    await adminFetch(`/api/admin/notifications/${id}/read`, { method: 'POST' })
    await loadList()
    emit('refresh')
  } catch {
    toast.error(t('admin.notifications.markReadError'))
  }
}

async function markAllRead() {
  try {
    await adminFetch('/api/admin/notifications/read-all', { method: 'POST' })
    await loadList()
    emit('refresh')
  } catch {
    toast.error(t('admin.notifications.markReadError'))
  }
}

function togglePref(
  key: 'notify_purchase' | 'notify_download' | 'notify_rating' | 'notify_comment' | 'notify_contact',
  v: boolean,
) {
  prefs.value[key] = v
  savePrefs()
}
</script>

<template>
  <UiDialog :open="props.open" @update:open="(v: boolean) => !v && emit('close')">
    <UiDialogPortal>
      <UiDialogOverlay />
      <UiDialogContent class="max-w-lg max-h-[90vh] overflow-y-auto">
        <UiDialogHeader>
          <UiDialogTitle>{{ t('admin.notifications.title') }}</UiDialogTitle>
          <UiDialogDescription class="sr-only">
            {{ t('admin.notifications.description') }}
          </UiDialogDescription>
        </UiDialogHeader>

        <div class="space-y-4">
          <div class="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
            <p class="text-sm font-medium font-heading">{{ t('admin.notifications.prefsTitle') }}</p>
            <div v-if="prefsLoading" class="text-xs text-muted-foreground">{{ t('common.loading') }}</div>
            <template v-else>
              <div class="flex items-center justify-between gap-3">
                <UiLabel class="text-sm">{{ t('admin.notifications.pref.purchase') }}</UiLabel>
                <Switch
                  :checked="prefs.notify_purchase"
                  @update:checked="(v: boolean) => togglePref('notify_purchase', v)"
                />
              </div>
              <div class="flex items-center justify-between gap-3">
                <UiLabel class="text-sm">{{ t('admin.notifications.pref.download') }}</UiLabel>
                <Switch
                  :checked="prefs.notify_download"
                  @update:checked="(v: boolean) => togglePref('notify_download', v)"
                />
              </div>
              <div class="flex items-center justify-between gap-3">
                <UiLabel class="text-sm">{{ t('admin.notifications.pref.rating') }}</UiLabel>
                <Switch
                  :checked="prefs.notify_rating"
                  @update:checked="(v: boolean) => togglePref('notify_rating', v)"
                />
              </div>
              <div class="flex items-center justify-between gap-3">
                <UiLabel class="text-sm">{{ t('admin.notifications.pref.comment') }}</UiLabel>
                <Switch
                  :checked="prefs.notify_comment"
                  @update:checked="(v: boolean) => togglePref('notify_comment', v)"
                />
              </div>
              <div class="flex items-center justify-between gap-3">
                <UiLabel class="text-sm">{{ t('admin.notifications.pref.contact') }}</UiLabel>
                <Switch
                  :checked="prefs.notify_contact"
                  @update:checked="(v: boolean) => togglePref('notify_contact', v)"
                />
              </div>
            </template>
          </div>

          <div class="flex justify-between items-center gap-2">
            <span class="text-xs text-muted-foreground">
              {{ t('admin.notifications.unreadCount', { count: unreadCount }) }}
            </span>
            <UiButton
              v-if="unreadCount > 0"
              variant="outline"
              size="sm"
              class="text-xs"
              @click="markAllRead"
            >
              {{ t('admin.notifications.markAllRead') }}
            </UiButton>
          </div>

          <div v-if="loading" class="py-8 text-center text-sm text-muted-foreground">
            {{ t('common.loading') }}
          </div>
          <p v-else-if="!items.length" class="py-8 text-center text-sm text-muted-foreground">
            {{ t('admin.notifications.empty') }}
          </p>
          <ul v-else class="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
            <li
              v-for="item in items"
              :key="item.id"
              class="rounded-lg border border-border p-3 text-sm transition-colors"
              :class="item.read ? 'bg-card opacity-80' : 'bg-primary/5 border-primary/20'"
            >
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0 flex-1">
                  <span class="text-xs font-medium text-primary">{{ kindLabel(item.kind) }}</span>
                  <template v-if="item.kind === 'contact'">
                    <p class="mt-1 font-medium text-foreground break-all">
                      {{ String(item.payload.email ?? '') }}
                    </p>
                    <p class="mt-1 text-foreground wrap-break-word whitespace-pre-wrap">
                      {{ String(item.payload.message ?? '') }}
                    </p>
                  </template>
                  <p v-else class="mt-1 text-foreground wrap-break-word whitespace-pre-wrap">
                    {{ lineForKind(item) }}
                  </p>
                  <p class="mt-1 text-xs text-muted-foreground">
                    {{ new Date(item.created_at).toLocaleString() }}
                  </p>
                </div>
                <UiButton
                  v-if="!item.read"
                  variant="ghost"
                  size="sm"
                  class="shrink-0 text-xs"
                  @click="markRead(item.id)"
                >
                  {{ t('admin.notifications.markRead') }}
                </UiButton>
              </div>
            </li>
          </ul>
        </div>
      </UiDialogContent>
    </UiDialogPortal>
  </UiDialog>
</template>
