<script setup lang="ts">
import { toast } from 'vue-sonner'
import { AVATAR_MAX_SIZE, PASSWORD_MIN_LENGTH } from '~/lib/validation'
import UiButton from '~/components/ui/Button.vue'
import UiDialog from '~/components/ui/dialog/Dialog.vue'
import UiDialogPortal from '~/components/ui/dialog/DialogPortal.vue'
import UiDialogOverlay from '~/components/ui/dialog/DialogOverlay.vue'
import UiDialogContent from '~/components/ui/dialog/DialogContent.vue'
import UiDialogDescription from '~/components/ui/dialog/DialogDescription.vue'
import UiDialogHeader from '~/components/ui/dialog/DialogHeader.vue'
import UiDialogTitle from '~/components/ui/dialog/DialogTitle.vue'
import UiDialogClose from '~/components/ui/dialog/DialogClose.vue'
import UiCard from '~/components/ui/Card.vue'
import UiCardContent from '~/components/ui/CardContent.vue'
import UiInput from '~/components/ui/Input.vue'
import UiPasswordInput from '~/components/ui/PasswordInput.vue'
import UiLabel from '~/components/ui/Label.vue'

const { isOpen, close } = useEditProfileModal()
const { session, fetchSession, updateUser } = useCurrentUser()

const name = ref('')
const avatarPreview = ref<string | null>(null)
const avatarUploading = ref(false)
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const loading = ref(false)

const provider = computed(() => session.value.user?.provider ?? 'credentials')
const isCredentials = computed(() => provider.value === 'credentials')
const emailVerified = computed(() => !!session.value.user?.email_verified)
const resendVerificationLoading = ref(false)

async function resendVerification() {
  resendVerificationLoading.value = true
  try {
    await $fetch('/api/user/resend-verification', { method: 'POST', credentials: 'include' })
    await fetchSession()
    toast.success('Το email επαλήθευσης στάλθηκε')
  } catch (e: unknown) {
    const err = e as { data?: { message?: string; statusCode?: number }; statusCode?: number } | null
    const status = err?.statusCode ?? err?.data?.statusCode
    const msg = err?.data?.message ?? ''
    toast.error(((msg) || (status === 429 ? 'Παρακαλώ περίμενε πριν ζητήσεις ξανά email επαλήθευσης' : 'Αποτυχία αποστολής email επαλήθευσης')))
  } finally {
    resendVerificationLoading.value = false
  }
}

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
  }
})

function onAvatarClick() {
  document.getElementById('ep-avatar-input')?.click()
}

async function onAvatarChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    toast.error('Επιτρέπονται μόνο εικόνες JPEG, PNG και WebP')
    input.value = ''
    return
  }
  if (file.size > AVATAR_MAX_SIZE) {
    toast.error('Η εικόνα πρέπει να είναι μικρότερη από 2 MB')
    input.value = ''
    return
  }
  if (avatarPreview.value?.startsWith('blob:')) URL.revokeObjectURL(avatarPreview.value)
  avatarPreview.value = URL.createObjectURL(file)
  avatarUploading.value = true
  try {
    const formData = new FormData()
    formData.append('file', file)
    const result = await $fetch<{ avatar_url: string }>('/api/user/avatar', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    })
    await fetchSession()
    updateUser({ avatar_url: result.avatar_url })
    avatarPreview.value = result.avatar_url
  } catch (err: unknown) {
    const error = err as { data?: { message?: string } }
    toast.error(error.data?.message || 'Κάτι πήγε στραβά')
  } finally {
    avatarUploading.value = false
    input.value = ''
  }
}

async function onSubmit() {
  if (isCredentials.value && newPassword.value) {
    if (newPassword.value.length < PASSWORD_MIN_LENGTH) {
      toast.error('Ο κωδικός πρέπει να έχει τουλάχιστον 8 χαρακτήρες')
      return
    }
    if (newPassword.value !== confirmPassword.value) {
      toast.error('Οι κωδικοί δεν ταιριάζουν')
      return
    }
  }

  loading.value = true
  try {
    const nameChanged = name.value.trim() !== (session.value.user?.name ?? '')
    const passwordChanged = isCredentials.value && newPassword.value.length > 0

    if (nameChanged || passwordChanged) {
      const body: Record<string, string | null> = {}
      if (nameChanged) body.name = name.value.trim() || null
      if (passwordChanged) {
        body.currentPassword = currentPassword.value
        body.newPassword = newPassword.value
      }
      const profileResult = await $fetch<{ id: string; email: string; name: string | null; avatar_url: string | null }>('/api/user/profile', { method: 'PATCH', body, credentials: 'include' })
      await fetchSession()
      updateUser({ name: profileResult.name, avatar_url: profileResult.avatar_url })
    }
    toast.success('Το προφίλ ενημερώθηκε')
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
  } catch (e: unknown) {
    console.error('[EditProfileModal] submit error:', e)
    const error = e as { data?: { message?: string } }
    toast.error(error.data?.message || 'Κάτι πήγε στραβά')
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
        <UiDialogDescription class="sr-only">Επεξεργασία προφίλ</UiDialogDescription>
        <UiDialogHeader>
          <div class="flex items-center justify-between mb-4">
            <UiDialogTitle class="text-xl font-bold font-heading">
              Επεξεργασία προφίλ
            </UiDialogTitle>
            <UiDialogClose as-child>
              <button
                type="button"
                class="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                aria-label="Κλείσιμο"
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
                <div class="flex flex-col items-center gap-3 rounded-lg bg-card p-4">
                  <button
                    type="button"
                    class="relative flex size-20 items-center justify-center overflow-hidden rounded-full border-2 border-border bg-muted hover:ring-2 hover:ring-primary/50 transition cursor-pointer disabled:pointer-events-none disabled:opacity-70"
                    aria-label="Φωτογραφία προφίλ"
                    :disabled="avatarUploading"
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
                    <span
                      v-if="!avatarUploading"
                      class="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 hover:opacity-100 transition text-white text-xs font-medium"
                    >
                      Φωτογραφία προφίλ
                    </span>
                    <span
                      v-else
                      class="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 text-white"
                    >
                      <VIcon name="bi-arrow-repeat" class="size-6 animate-spin" />
                    </span>
                  </button>
                  <input id="ep-avatar-input" type="file" accept="image/jpeg,image/png,image/webp" class="sr-only" @change="onAvatarChange" >
                  <p class="text-center text-xs text-muted-foreground">JPEG, PNG ή WebP, μέγιστο 2MB</p>
                </div>

                <!-- Account info (read-only) -->
                <div class="rounded-lg border bg-muted/40 p-4 space-y-2.5 text-sm">
                  <p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                    Τρόπος σύνδεσης
                  </p>
                  <div class="flex items-start gap-2 text-foreground">
                    <VIcon name="bi-envelope" class="size-4 shrink-0 mt-0.5 text-muted-foreground" />
                    <span class="break-all text-xs">{{ session.user?.email }}</span>
                  </div>
                  <div class="flex items-center gap-2 text-foreground">
                    <VIcon name="bi-gear" class="size-4 shrink-0 text-muted-foreground" />
                    <span class="text-xs">{{ isCredentials ? 'Email & κωδικός' : 'Λογαριασμός Google' }}</span>
                  </div>
                  <div v-if="joinedAt" class="flex items-center gap-2 text-foreground">
                    <VIcon name="bi-journal-bookmark" class="size-4 shrink-0 text-muted-foreground" />
                    <span class="text-xs">Μέλος από: {{ joinedAt }}</span>
                  </div>
                  <div v-if="isCredentials" class="flex flex-col gap-1.5">
                    <div v-if="emailVerified" class="flex items-center gap-2 text-foreground">
                      <VIcon name="bi-check-circle-fill" class="size-4 shrink-0 text-green-600 dark:text-green-500" />
                      <span class="text-xs">Email επαληθεύτηκε</span>
                    </div>
                    <template v-else>
                      <div class="flex items-center gap-2 text-foreground">
                        <VIcon name="bi-exclamation-circle" class="size-4 shrink-0 text-amber-600 dark:text-amber-500" />
                        <span class="text-xs">Email μη επαληθευμένο</span>
                      </div>
                      <UiButton
                        type="button"
                        variant="outline"
                        size="sm"
                        class="h-7 text-xs"
                        :disabled="resendVerificationLoading"
                        @click="resendVerification"
                      >
                        {{ resendVerificationLoading ? 'Φόρτωση...' : 'Επαναποστολή email επαλήθευσης' }}
                      </UiButton>
                    </template>
                  </div>
                </div>
              </div>

              <!-- RIGHT: editable fields -->
              <div class="flex-1 space-y-6">
                <div class="space-y-2">
                  <UiLabel for="ep-name">Όνομα</UiLabel>
                  <UiInput id="ep-name" v-model="name" type="text" />
                </div>

                <template v-if="isCredentials">
                  <div class="border-t pt-6 space-y-4">
                    <p class="text-sm font-semibold">Αλλαγή κωδικού</p>
                    <div class="space-y-2">
                      <UiLabel for="ep-current-password">Τρέχων κωδικός</UiLabel>
                      <UiPasswordInput id="ep-current-password" v-model="currentPassword" autocomplete="current-password" />
                    </div>
                    <div class="space-y-2">
                      <UiLabel for="ep-new-password">Νέος κωδικός</UiLabel>
                      <UiPasswordInput id="ep-new-password" v-model="newPassword" autocomplete="new-password" />
                    </div>
                    <div class="space-y-2">
                      <UiLabel for="ep-confirm-password">Επιβεβαίωση νέου κωδικού</UiLabel>
                      <UiPasswordInput id="ep-confirm-password" v-model="confirmPassword" autocomplete="new-password" />
                    </div>
                  </div>
                </template>

                <UiButton type="submit" class="w-full" :disabled="loading">
                  {{ loading ? 'Φόρτωση...' : 'Αποθήκευση' }}
                </UiButton>
              </div>

            </form>
          </UiCardContent>
        </UiCard>

      </UiDialogContent>
    </UiDialogPortal>
  </UiDialog>
</template>
