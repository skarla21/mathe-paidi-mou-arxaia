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
import UiTextarea from '~/components/ui/Textarea.vue'
import { Switch } from '~/components/ui/switch'
import type { Article } from '~/types/database'

const props = defineProps<{ open: boolean; article: Article | null }>()
const emit = defineEmits<{ close: []; saved: [] }>()
const { t } = useI18n()
const adminFetch = useAdminFetch()

const title = ref('')
const body = ref('')
const tagsInput = ref('')
const published = ref(false)
const saving = ref(false)

watch(
  () => props.open,
  (open) => {
    if (!open) return
    if (props.article) {
      title.value = props.article.title
      body.value = props.article.body
      tagsInput.value = (props.article.tags ?? []).join(', ')
      published.value = props.article.published
    } else {
      title.value = ''
      body.value = ''
      tagsInput.value = ''
      published.value = false
    }
  },
)

function parseTags(): string[] {
  return tagsInput.value
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
}

async function save() {
  const tVal = title.value.trim()
  if (!tVal) {
    toast.error(t('common.error'))
    return
  }
  const bVal = body.value.trim()
  if (!bVal) {
    toast.error(t('common.error'))
    return
  }
  saving.value = true
  const tags = parseTags()
  try {
    if (props.article?.id) {
      await adminFetch(`/api/admin/articles/${props.article.id}`, {
        method: 'PATCH',
        body: { title: tVal, body: bVal, tags, published: published.value },
      })
    } else {
      await adminFetch('/api/admin/articles', {
        method: 'POST',
        body: { title: tVal, body: bVal, tags, published: published.value },
      })
    }
    toast.success(t('admin.articleSaved'))
    emit('saved')
    emit('close')
  } catch {
    toast.error(t('common.error'))
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <UiDialog :open="props.open" @update:open="(v: boolean) => !v && emit('close')">
    <UiDialogPortal>
      <UiDialogOverlay />
      <UiDialogContent class="max-w-lg max-h-[90vh] overflow-y-auto">
        <UiDialogHeader>
          <UiDialogTitle>{{ props.article ? t('admin.modal.edit') : t('admin.modal.create') }}</UiDialogTitle>
          <UiDialogDescription>{{ t('admin.articleModalDescription') }}</UiDialogDescription>
        </UiDialogHeader>
        <div class="space-y-4 py-2">
          <div>
            <UiLabel class="mb-1.5 block">{{ t('admin.field.title') }}</UiLabel>
            <UiInput v-model="title" />
          </div>
          <div>
            <UiLabel class="mb-1.5 block">{{ t('admin.field.tags') }}</UiLabel>
            <UiInput v-model="tagsInput" :placeholder="t('admin.field.tags')" />
          </div>
          <div>
            <UiLabel class="mb-1.5 block">{{ t('admin.field.content') }}</UiLabel>
            <UiTextarea v-model="body" class="min-h-[200px] font-mono text-sm" />
          </div>
          <div class="flex items-center justify-between gap-3">
            <UiLabel>{{ t('admin.field.published') }}</UiLabel>
            <Switch :checked="published" @update:checked="(v: boolean) => (published = v)" />
          </div>
        </div>
        <UiDialogFooter class="gap-2">
          <UiButton variant="outline" @click="emit('close')">{{ t('admin.modal.cancel') }}</UiButton>
          <UiButton :disabled="saving" @click="save">{{ t('admin.modal.save') }}</UiButton>
        </UiDialogFooter>
      </UiDialogContent>
    </UiDialogPortal>
  </UiDialog>
</template>
