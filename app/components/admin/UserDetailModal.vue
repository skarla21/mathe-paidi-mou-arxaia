<script setup lang="ts">
import UiDialog from '~/components/ui/dialog/Dialog.vue'
import UiDialogPortal from '~/components/ui/dialog/DialogPortal.vue'
import UiDialogOverlay from '~/components/ui/dialog/DialogOverlay.vue'
import UiDialogContent from '~/components/ui/dialog/DialogContent.vue'
import UiDialogHeader from '~/components/ui/dialog/DialogHeader.vue'
import UiDialogFooter from '~/components/ui/dialog/DialogFooter.vue'
import UiDialogTitle from '~/components/ui/dialog/DialogTitle.vue'
import UiButton from '~/components/ui/Button.vue'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'

import type { Purchase, Download } from '~/types/database'

const props = defineProps<{ open: boolean; userId: string | null }>()
const emit = defineEmits<{ close: [] }>()
const { t } = useI18n()
const adminFetch = useAdminFetch()

const purchases = ref<Purchase[]>([])
const downloads = ref<Download[]>([])
const loading = ref(false)

watch(() => props.open, async (val) => {
  if (!val || !props.userId) return
  loading.value = true
  try {
    const [p, d] = await Promise.all([
      adminFetch<Purchase[]>(`/api/admin/users/${props.userId}/purchases`),
      adminFetch<Download[]>(`/api/admin/users/${props.userId}/downloads`),
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
        <Tabs v-else default-value="downloads">
          <TabsList class="w-full">
            <TabsTrigger value="downloads" class="flex-1">
              {{ t('admin.field.downloads') }} ({{ downloads.length }})
            </TabsTrigger>
            <TabsTrigger value="purchases" class="flex-1">
              {{ t('admin.field.purchases') }} ({{ purchases.length }})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="downloads" class="mt-4">
            <p v-if="!downloads.length" class="text-xs text-muted-foreground">{{ t('common.empty') }}</p>
            <ul v-else class="text-xs space-y-1">
              <li v-for="d in downloads" :key="d.id" class="flex justify-between gap-2">
                <span>{{ d.lessons?.title }}</span>
                <span class="text-muted-foreground shrink-0">{{ new Date(d.downloaded_at).toLocaleDateString() }}</span>
              </li>
            </ul>
          </TabsContent>
          <TabsContent value="purchases" class="mt-4">
            <p v-if="!purchases.length" class="text-xs text-muted-foreground">{{ t('common.empty') }}</p>
            <ul v-else class="text-xs space-y-1">
              <li v-for="p in purchases" :key="p.id" class="flex justify-between gap-2">
                <span>{{ p.lessons?.title }}</span>
                <span class="text-muted-foreground shrink-0">{{ new Date(p.created_at).toLocaleDateString() }}</span>
              </li>
            </ul>
          </TabsContent>
        </Tabs>
        <UiDialogFooter class="mt-4">
          <UiButton variant="outline" @click="emit('close')">{{ t('admin.modal.cancel') }}</UiButton>
        </UiDialogFooter>
      </UiDialogContent>
    </UiDialogPortal>
  </UiDialog>
</template>
