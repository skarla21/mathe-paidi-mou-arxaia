<script setup lang="ts">
import { toast } from 'vue-sonner'
import UiButton from '~/components/ui/Button.vue'
import UiCard from '~/components/ui/Card.vue'
import UiCardContent from '~/components/ui/CardContent.vue'
import UiCardHeader from '~/components/ui/CardHeader.vue'
import UiInput from '~/components/ui/Input.vue'
import UiLabel from '~/components/ui/Label.vue'

definePageMeta({
  middleware: 'guest-only',
})

const { t } = useI18n()
const { fetchSession } = useCurrentUser()
const { openForgot } = useAuthModal()
const { signInWithGoogle } = useGoogleSignIn()

useHead(() => ({
  title: t('auth.login.title'),
}))

const email = ref('')
const password = ref('')
const loading = ref(false)
const pendingToast = useState<string | null>('pendingToast', () => null)

async function onGoogleLogin() {
  await signInWithGoogle("/")
}

async function onSubmit() {
  loading.value = true
  try {
    const { csrfToken } = await $fetch<{ csrfToken: string }>('/api/auth/csrf', {
      credentials: 'include',
    })

    const result = await $fetch<{ url?: string }>(
      '/api/auth/callback/credentials',
      {
        method: 'POST',
        headers: { 'X-Auth-Return-Redirect': '1' },
        body: {
          email: email.value,
          password: password.value,
          csrfToken,
          callbackUrl: '/',
        },
        credentials: 'include',
      },
    )

    const redirectUrl = result?.url ?? ''
    if (redirectUrl.includes('/error') || redirectUrl.includes('error=')) {
      const urlParams = new URLSearchParams(redirectUrl.split('?')[1] ?? '')
      const errorCode = urlParams.get('error') ?? ''
      const errorMap: Record<string, string> = {
        CredentialsSignin: t('auth.login.error.invalidCredentials'),
        OAuthAccountNotLinked: t('auth.login.error.oauthNotLinked'),
      }
      toast.error(errorMap[errorCode] ?? t('auth.login.error.generic'))
      return
    }

    await fetchSession()
    pendingToast.value = 'login'
    await navigateTo('/')
  } catch (e: unknown) {
    const error = e as { data?: { message?: string }; message?: string }
    toast.error(error?.data?.message ?? error?.message ?? t('auth.login.error.generic'))
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-full flex items-center justify-center p-4">
    <UiCard
      class="relative flex flex-col justify-center w-full max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl min-h-[32rem] overflow-hidden border-0 rounded-2xl shadow-[0_0_30px_-8px_rgba(0,0,0,0.12)] bg-transparent dark:bg-card/80 dark:backdrop-blur-md dark:border dark:border-border"
    >
      <div
        class="absolute inset-0 rounded-2xl bg-cover bg-center bg-no-repeat"
        :style="{ backgroundImage: `url('/imgs/login_bg.jpg')`, opacity: 0.2 }"
        aria-hidden="true"
      />
      <div class="relative z-10 rounded-2xl max-w-sm mx-auto">
        <UiCardHeader class="space-y-1 pb-4">
          <h1 class="text-2xl font-bold font-heading">
            {{ t('auth.login.title') }}
          </h1>
          <p class="text-muted-foreground text-sm">
            {{ t('auth.login.subtitle') }}
          </p>
        </UiCardHeader>
        <UiCardContent class="space-y-4 pt-0">
          <form class="space-y-4" @submit.prevent="onSubmit">
            <div class="space-y-2">
              <UiLabel for="email">{{ t('auth.login.email') }}</UiLabel>
              <UiInput id="email" v-model="email" type="email" required />
            </div>

            <div class="space-y-2">
              <UiLabel for="password">{{ t('auth.login.password') }}</UiLabel>
              <UiInput
                id="password"
                v-model="password"
                type="password"
                required
              />
              <button
                type="button"
                class="text-xs text-primary font-medium hover:underline cursor-pointer"
                @click="openForgot"
              >
                {{ t('auth.forgotPassword.link') }}
              </button>
            </div>

            <UiButton type="submit" class="w-full" :disabled="loading">
              <span v-if="!loading">{{ t('auth.login.submit') }}</span>
              <span v-else>{{ t('auth.login.submitting') }}</span>
            </UiButton>
          </form>

          <div>
            <UiButton
              type="button"
              variant="outline"
              class="w-full gap-2"
              @click="onGoogleLogin"
            >
              <svg
                class="h-5 w-5 shrink-0"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {{ t('auth.login.google') }}
            </UiButton>
          </div>

          <p class="text-center text-sm text-muted-foreground">
            {{ t('auth.login.noAccount') }}
            <NuxtLink
              to="/register"
              class="text-primary font-medium hover:underline"
            >
              {{ t('auth.login.registerLink') }}
            </NuxtLink>
          </p>

          <NuxtLink
            to="/"
            class="flex items-center justify-center gap-1 text-sm text-primary hover:underline"
          >
            <VIcon name="bi-arrow-right" class="size-4 rotate-180" aria-hidden="true" /> {{ t('auth.back') }}
          </NuxtLink>
        </UiCardContent>
      </div>
    </UiCard>
  </div>
</template>
