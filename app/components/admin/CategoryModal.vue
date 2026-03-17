<script setup lang="ts">
import { toast } from 'vue-sonner'
import UiDialog from '~/components/ui/dialog/Dialog.vue'
import UiDialogPortal from '~/components/ui/dialog/DialogPortal.vue'
import UiDialogOverlay from '~/components/ui/dialog/DialogOverlay.vue'
import UiDialogContent from '~/components/ui/dialog/DialogContent.vue'
import UiDialogHeader from '~/components/ui/dialog/DialogHeader.vue'
import UiDialogFooter from '~/components/ui/dialog/DialogFooter.vue'
import UiDialogTitle from '~/components/ui/dialog/DialogTitle.vue'
import UiDialogDescription from '~/components/ui/dialog/DialogDescription.vue'
import UiButton from '~/components/ui/Button.vue'
import UiInput from '~/components/ui/Input.vue'
import UiLabel from '~/components/ui/Label.vue'

const props = defineProps<{
  open: boolean
  category: { id: string; name: string; order: number } | null
}>()
const emit = defineEmits<{ close: []; saved: [] }>()
const { t } = useI18n()

const name = ref('')
const order = ref(0)
const loading = ref(false)

watch(() => props.open, (val) => {
  if (val) {
    name.value = props.category?.name ?? ''
    order.value = props.category?.order ?? 0
  }
})

async function onSubmit() {
  if (!name.value.trim()) return
  loading.value = true
  try {
    if (props.category) {
      await $fetch(`/api/admin/categories/${props.category.id}`, { method: 'PATCH', body: { name: name.value, order: order.value } })
    } else {
      await $fetch('/api/admin/categories', { method: 'POST', body: { name: name.value, order: order.value } })
    }
    emit('saved')
    emit('close')
  } catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    toast.error(err?.data?.message ?? t('common.error'))
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UiDialog :open="props.open" @update:open="(v: boolean) => !v && emit('close')">
    <UiDialogPortal>
      <UiDialogOverlay />
      <UiDialogContent>
        <UiDialogHeader>
          <UiDialogTitle>{{ props.category ? t('admin.modal.edit') : t('admin.modal.create') }} — {{ t('admin.categories') }}</UiDialogTitle>
          <UiDialogDescription class="sr-only">{{ t('admin.modal.categoryDescription') }}</UiDialogDescription>
        </UiDialogHeader>
        <form class="space-y-4" @submit.prevent="onSubmit">
          <div class="space-y-1.5">
            <UiLabel for="category-name">{{ t('admin.field.name') }}</UiLabel>
            <UiInput id="category-name" v-model="name" required />
          </div>
          <div class="space-y-1.5">
            <UiLabel for="category-order">{{ t('admin.field.order') }}</UiLabel>
            <UiInput id="category-order" v-model.number="order" type="number" min="0" />
          </div>
          <UiDialogFooter>
            <UiButton type="button" variant="outline" @click="emit('close')">{{ t('admin.modal.cancel') }}</UiButton>
            <UiButton type="submit" :disabled="loading">{{ loading ? t('common.loading') : t('admin.modal.save') }}</UiButton>
          </UiDialogFooter>
        </form>
      </UiDialogContent>
    </UiDialogPortal>
  </UiDialog>
</template>
