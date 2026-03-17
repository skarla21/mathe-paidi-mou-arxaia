<script setup lang="ts">
import UiDialog from '~/components/ui/dialog/Dialog.vue'
import UiDialogPortal from '~/components/ui/dialog/DialogPortal.vue'
import UiDialogOverlay from '~/components/ui/dialog/DialogOverlay.vue'
import UiDialogContent from '~/components/ui/dialog/DialogContent.vue'
import UiDialogHeader from '~/components/ui/dialog/DialogHeader.vue'
import UiDialogFooter from '~/components/ui/dialog/DialogFooter.vue'
import UiDialogTitle from '~/components/ui/dialog/DialogTitle.vue'
import UiButton from '~/components/ui/Button.vue'

import type { Purchase, Download } from '~/types/database'

const props = defineProps<{ open: boolean; userId: string | null }>()
const emit = defineEmits<{ close: [] }>()
const { t } = useI18n()

const purchases = ref<Purchase[]>([])
const downloads = ref<Download[]>([])
const loading = ref(false)

watch(() => props.open, async (val) => {
  if (!val || !props.userId) return
  loading.value = true
  try {
    const [p, d] = await Promise.all([
      $fetch<Purchase[]>(`/api/admin/users/${props.userId}/purchases`),
      $fetch<Download[]>(`/api/admin/users/${props.userId}/downloads`),
    ])
    purchases.value = p
    downloads.value = d
  } catch { /* ignore */ }
  finally { loading.value = false }
})
</script>

<template>
  <UiDialog :open="!!props.open" @update:open="(v: boolean) => !v && emit('close')">
    <UiDialogPortal>
      <UiDialogOverlay />
      <UiDialogContent class="max-w-lg max-h-[80vh] overflow-y-auto">
        <UiDialogHeader>
          <UiDialogTitle>{{ t('admin.userDetails') }}</UiDialogTitle>
        </UiDialogHeader>
        <div v-if="loading" class="py-4 text-sm text-muted-foreground">{{ t('common.loading') }}</div>
        <div v-else class="space-y-5">
          <div>
            <p class="text-sm font-semibold mb-2">{{ t('admin.field.purchases') }}</p>
            <p v-if="!purchases.length" class="text-xs text-muted-foreground">—</p>
            <ul v-else class="text-xs space-y-1">
              <li v-for="p in purchases" :key="p.id">{{ p.lessons?.title }} — {{ new Date(p.created_at).toLocaleDateString() }}</li>
            </ul>
          </div>
          <div>
            <p class="text-sm font-semibold mb-2">{{ t('admin.field.downloads') }}</p>
            <p v-if="!downloads.length" class="text-xs text-muted-foreground">—</p>
            <ul v-else class="text-xs space-y-1">
              <li v-for="d in downloads" :key="d.id">{{ d.lessons?.title }} — {{ new Date(d.downloaded_at).toLocaleDateString() }}</li>
            </ul>
          </div>
        </div>
        <UiDialogFooter>
          <UiButton variant="outline" @click="emit('close')">{{ t('admin.modal.cancel') }}</UiButton>
        </UiDialogFooter>
      </UiDialogContent>
    </UiDialogPortal>
  </UiDialog>
</template>
