<script setup lang="ts">
import { toast } from 'vue-sonner'
import UiButton from '~/components/ui/Button.vue'
import UiCard from '~/components/ui/Card.vue'
import UiCardContent from '~/components/ui/CardContent.vue'
import UiCardHeader from '~/components/ui/CardHeader.vue'
import UiInput from '~/components/ui/Input.vue'
import UiLabel from '~/components/ui/Label.vue'

definePageMeta({ middleware: 'auth' })

const { session, fetchSession } = useCurrentUser()
const { t } = useI18n()

useHead(() => ({ title: t('profile.edit.title') }))

onUnmounted(() => {
  if (avatarPreview.value?.startsWith('blob:')) URL.revokeObjectURL(avatarPreview.value)
})

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

function onAvatarClick() {
  document.getElementById('avatar-input')?.click()
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
      await $fetch('/api/user/avatar', { method: 'POST', body: formData, credentials: 'include' })
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
      await $fetch('/api/user/profile', { method: 'PATCH', body, credentials: 'include' })
    }

    await fetchSession()
    toast.success(t('profile.edit.success'))
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
  } catch (e: unknown) {
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
  <div class="container max-w-2xl py-8 px-4">
    <UiCard>
      <UiCardHeader>
        <h1 class="text-2xl font-bold font-heading">{{ t('profile.edit.title') }}</h1>
      </UiCardHeader>
      <UiCardContent>
        <form class="flex flex-col sm:flex-row gap-6" @submit.prevent="onSubmit">

          <!-- LEFT: avatar + account info -->
          <div class="flex flex-col gap-4 sm:w-48 shrink-0">

            <!-- Avatar -->
            <div class="flex flex-col items-center gap-3 rounded-lg border bg-card p-4">
              <button
                type="button"
                class="relative flex size-20 items-center justify-center overflow-hidden rounded-full bg-muted hover:ring-2 hover:ring-primary/50 transition"
                :aria-label="t('profile.edit.avatar')"
                @click="onAvatarClick"
              >
                <img v-if="avatarPreview" :src="avatarPreview" alt="" class="size-full object-cover" >
                <VIcon v-else name="bi-person-circle" class="size-12 text-muted-foreground" />
                <span class="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 hover:opacity-100 transition text-white text-xs font-medium">
                  {{ t('profile.edit.avatar') }}
                </span>
              </button>
              <input id="avatar-input" type="file" accept="image/jpeg,image/png,image/webp" class="sr-only" @change="onAvatarChange" >
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
              <UiLabel for="name">{{ t('profile.edit.name') }}</UiLabel>
              <UiInput id="name" v-model="name" type="text" />
            </div>

            <template v-if="isCredentials">
              <div class="border-t pt-6 space-y-4">
                <p class="text-sm font-semibold">{{ t('profile.edit.passwordSection') }}</p>
                <div class="space-y-2">
                  <UiLabel for="current-password">{{ t('profile.edit.currentPassword') }}</UiLabel>
                  <UiInput id="current-password" v-model="currentPassword" type="password" autocomplete="current-password" />
                </div>
                <div class="space-y-2">
                  <UiLabel for="new-password">{{ t('profile.edit.newPassword') }}</UiLabel>
                  <UiInput id="new-password" v-model="newPassword" type="password" autocomplete="new-password" />
                </div>
                <div class="space-y-2">
                  <UiLabel for="confirm-password">{{ t('profile.edit.confirmPassword') }}</UiLabel>
                  <UiInput id="confirm-password" v-model="confirmPassword" type="password" autocomplete="new-password" />
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
  </div>
</template>
