<script setup lang="ts">
import { toast } from 'vue-sonner'
import UiButton from '~/components/ui/Button.vue'
import UiDialog from '~/components/ui/dialog/Dialog.vue'
import UiDialogPortal from '~/components/ui/dialog/DialogPortal.vue'
import UiDialogOverlay from '~/components/ui/dialog/DialogOverlay.vue'
import UiDialogContent from '~/components/ui/dialog/DialogContent.vue'
import UiDialogHeader from '~/components/ui/dialog/DialogHeader.vue'
import UiDialogTitle from '~/components/ui/dialog/DialogTitle.vue'
import UiDialogClose from '~/components/ui/dialog/DialogClose.vue'
import UiCard from '~/components/ui/Card.vue'
import UiCardContent from '~/components/ui/CardContent.vue'
import UiInput from '~/components/ui/Input.vue'
import UiLabel from '~/components/ui/Label.vue'

const { isOpen, close } = useEditProfileModal()
const { session, fetchSession } = useCurrentUser()
const { t } = useI18n()

const name = ref('')
const avatarFile = ref<File | null>(null)
const avatarPreview = ref<string | null>(null)
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const loading = ref(false)

const provider = computed(() => session.value.user?.provider ?? 'credentials')
const isCredentials = computed(() => provider.value === 'credentials')

const joinedAt = computed(() => {
  const raw = session.value.user?.created_at
  if (!raw) return ''
  return new Date(raw).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })
})

// Populate form fields when modal opens or user changes
watch(
  () => session.value.user,
  (user) => {
    if (user) {
      name.value = user.name ?? ''
      avatarPreview.value = user.avatar_url ?? null
    }
  },
  { immediate: true },
)

// Revoke blob URL when modal closes (modal is permanently mounted — onUnmounted never fires)
watch(isOpen, (open) => {
  if (!open && avatarPreview.value?.startsWith('blob:')) {
    URL.revokeObjectURL(avatarPreview.value)
    avatarPreview.value = session.value.user?.avatar_url ?? null
    avatarFile.value = null
  }
})

function onAvatarClick() {
  document.getElementById('ep-avatar-input')?.click()
}

function onAvatarChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    toast.error(t('profile.edit.avatarTypeError'))
    return
  }
  if (file.size > 2 * 1024 * 1024) {
    toast.error(t('profile.edit.avatarSizeError'))
    return
  }
  if (avatarPreview.value?.startsWith('blob:')) URL.revokeObjectURL(avatarPreview.value)
  avatarFile.value = file
  avatarPreview.value = URL.createObjectURL(file)
}

async function onSubmit() {
  if (isCredentials.value && newPassword.value) {
    if (newPassword.value.length < 8) {
      toast.error(t('profile.edit.passwordMin'))
      return
    }
    if (newPassword.value !== confirmPassword.value) {
      toast.error(t('profile.edit.passwordMismatch'))
      return
    }
  }

  loading.value = true
  try {
    if (avatarFile.value) {
      const formData = new FormData()
      formData.append('file', avatarFile.value)
      await $fetch<{ avatar_url: string }>('/api/user/avatar', { method: 'POST', body: formData, credentials: 'include' })
      avatarFile.value = null
    }

    const nameChanged = name.value.trim() !== (session.value.user?.name ?? '')
    const passwordChanged = isCredentials.value && newPassword.value.length > 0

    if (nameChanged || passwordChanged) {
      const body: Record<string, string | null> = {}
      if (nameChanged) body.name = name.value.trim() || null
      if (passwordChanged) {
        body.currentPassword = currentPassword.value
        body.newPassword = newPassword.value
      }
      await $fetch<{ id: string; email: string; name: string | null; avatar_url: string | null }>('/api/user/profile', { method: 'PATCH', body, credentials: 'include' })
    }

    await fetchSession()
    toast.success(t('profile.edit.success'))
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
  } catch (e: unknown) {
    console.error('[EditProfileModal] submit error:', e)
    const error = e as { data?: { statusCode?: number; message?: string } }
    const status = error?.data?.statusCode
    if (status === 400 && error?.data?.message?.includes('password')) {
      toast.error(t('profile.edit.passwordWrong'))
    } else {
      toast.error(t('common.error'))
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UiDialog :open="isOpen" @update:open="(v: boolean) => !v && close()">
    <UiDialogPortal>
      <UiDialogOverlay />
      <UiDialogContent class="max-w-2xl max-h-[90vh] overflow-y-auto">

        <UiDialogHeader>
          <div class="flex items-center justify-between mb-4">
            <UiDialogTitle class="text-xl font-bold font-heading">
              {{ t('profile.edit.title') }}
            </UiDialogTitle>
            <UiDialogClose as-child>
              <button
                type="button"
                class="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                :aria-label="t('common.close')"
              >
                <VIcon name="bi-x" class="size-5" aria-hidden="true" />
              </button>
            </UiDialogClose>
          </div>
        </UiDialogHeader>

        <UiCard class="border-0 shadow-none p-0">
          <UiCardContent class="p-0">
            <form class="flex flex-col sm:flex-row gap-6" @submit.prevent="onSubmit">

              <!-- LEFT: avatar + account info -->
              <div class="flex flex-col gap-4 sm:w-48 shrink-0">

                <!-- Avatar -->
                <div class="flex flex-col items-center gap-3 rounded-lg border bg-card p-4">
                  <button
                    type="button"
                    class="relative flex size-20 items-center justify-center overflow-hidden rounded-full border-2 border-border bg-muted hover:ring-2 hover:ring-primary/50 transition"
                    :aria-label="t('profile.edit.avatar')"
                    @click="onAvatarClick"
                  >
                    <img v-if="avatarPreview" :src="avatarPreview" alt="" class="size-full object-cover" >
                    <svg
                      v-else
                      xmlns="http://www.w3.org/2000/svg"
                      width="44"
                      height="44"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                      class="text-muted-foreground"
                    >
                      <circle cx="12" cy="8" r="4" fill="currentColor" />
                      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" fill="currentColor" />
                    </svg>
                    <span class="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 hover:opacity-100 transition text-white text-xs font-medium">
                      {{ t('profile.edit.avatar') }}
                    </span>
                  </button>
                  <input id="ep-avatar-input" type="file" accept="image/jpeg,image/png,image/webp" class="sr-only" @change="onAvatarChange" >
                  <p class="text-center text-xs text-muted-foreground">{{ t('profile.edit.avatarHint') }}</p>
                </div>

                <!-- Account info (read-only) -->
                <div class="rounded-lg border bg-muted/40 p-4 space-y-2.5 text-sm">
                  <p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                    {{ t('profile.edit.provider') }}
                  </p>
                  <div class="flex items-start gap-2 text-foreground">
                    <VIcon name="bi-envelope" class="size-4 shrink-0 mt-0.5 text-muted-foreground" />
                    <span class="break-all text-xs">{{ session.user?.email }}</span>
                  </div>
                  <div class="flex items-center gap-2 text-foreground">
                    <VIcon name="bi-gear" class="size-4 shrink-0 text-muted-foreground" />
                    <span class="text-xs">{{ isCredentials ? t('profile.edit.providerCredentials') : t('profile.edit.providerGoogle') }}</span>
                  </div>
                  <div v-if="joinedAt" class="flex items-center gap-2 text-foreground">
                    <VIcon name="bi-journal-bookmark" class="size-4 shrink-0 text-muted-foreground" />
                    <span class="text-xs">{{ t('profile.edit.joinedAt') }}: {{ joinedAt }}</span>
                  </div>
                </div>
              </div>

              <!-- RIGHT: editable fields -->
              <div class="flex-1 space-y-6">
                <div class="space-y-2">
                  <UiLabel for="ep-name">{{ t('profile.edit.name') }}</UiLabel>
                  <UiInput id="ep-name" v-model="name" type="text" />
                </div>

                <template v-if="isCredentials">
                  <div class="border-t pt-6 space-y-4">
                    <p class="text-sm font-semibold">{{ t('profile.edit.passwordSection') }}</p>
                    <div class="space-y-2">
                      <UiLabel for="ep-current-password">{{ t('profile.edit.currentPassword') }}</UiLabel>
                      <UiInput id="ep-current-password" v-model="currentPassword" type="password" autocomplete="current-password" />
                    </div>
                    <div class="space-y-2">
                      <UiLabel for="ep-new-password">{{ t('profile.edit.newPassword') }}</UiLabel>
                      <UiInput id="ep-new-password" v-model="newPassword" type="password" autocomplete="new-password" />
                    </div>
                    <div class="space-y-2">
                      <UiLabel for="ep-confirm-password">{{ t('profile.edit.confirmPassword') }}</UiLabel>
                      <UiInput id="ep-confirm-password" v-model="confirmPassword" type="password" autocomplete="new-password" />
                    </div>
                  </div>
                </template>

                <UiButton type="submit" class="w-full" :disabled="loading">
                  {{ loading ? t('common.loading') : t('profile.edit.save') }}
                </UiButton>
              </div>

            </form>
          </UiCardContent>
        </UiCard>

      </UiDialogContent>
    </UiDialogPortal>
  </UiDialog>
</template>
