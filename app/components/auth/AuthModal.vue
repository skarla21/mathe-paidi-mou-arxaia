<script setup lang="ts">
import { toast } from 'vue-sonner'

const { t } = useI18n()
const { isOpen, activeTab, pendingRedirect, close } = useAuthModal()
const { fetchSession } = useCurrentUser()

// Login state
const loginEmail = ref('')
const loginPassword = ref('')
const loginLoading = ref(false)
const loginErrors = ref<{ email?: string; password?: string }>({})

// Register state
const registerName = ref('')
const registerEmail = ref('')
const registerPassword = ref('')
const registerLoading = ref(false)
const registerErrors = ref<{ name?: string; email?: string; password?: string }>({})

// Clear errors on tab switch (keep field values)
watch(activeTab, () => {
  loginErrors.value = {}
  registerErrors.value = {}
})

async function onGoogleLogin() {
  await navigateTo('/api/auth/signin/google', { external: true })
}

async function onLoginSubmit() {
  loginErrors.value = {}
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(loginEmail.value)) loginErrors.value.email = t('auth.validation.emailInvalid')
  if (loginPassword.value.length < 6) loginErrors.value.password = t('auth.validation.passwordMin')
  if (Object.keys(loginErrors.value).length > 0) return

  loginLoading.value = true
  try {
    const { csrfToken } = await $fetch<{ csrfToken: string }>('/api/auth/csrf', { credentials: 'include' })
    const result = await $fetch<{ url?: string }>('/api/auth/callback/credentials', {
      method: 'POST',
      headers: { 'X-Auth-Return-Redirect': '1' },
      body: { email: loginEmail.value, password: loginPassword.value, csrfToken, callbackUrl: '/' },
      credentials: 'include',
    })
    const redirectUrl = result?.url ?? ''
    if (!redirectUrl || redirectUrl.includes('/error') || redirectUrl.includes('error=')) {
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
    const redirect = pendingRedirect.value
    close()
    toast.success(t('auth.login.successToast'))
    if (redirect) await navigateTo(redirect)
  } catch (e: unknown) {
    const error = e as { data?: { message?: string }; message?: string }
    toast.error(error?.data?.message ?? error?.message ?? t('auth.login.error.generic'))
  } finally {
    loginLoading.value = false
  }
}

async function onRegisterSubmit() {
  registerErrors.value = {}
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (registerName.value.trim().length < 2) registerErrors.value.name = t('auth.validation.nameMin')
  if (!emailRegex.test(registerEmail.value)) registerErrors.value.email = t('auth.validation.emailInvalid')
  if (registerPassword.value.length < 6) registerErrors.value.password = t('auth.validation.passwordMin')
  if (Object.keys(registerErrors.value).length > 0) return

  registerLoading.value = true
  try {
    await $fetch<{ ok: true }>('/api/auth/register', {
      method: 'POST',
      body: { name: registerName.value.trim(), email: registerEmail.value, password: registerPassword.value },
    })
    const { csrfToken } = await $fetch<{ csrfToken: string }>('/api/auth/csrf', { credentials: 'include' })
    const signInResult = await $fetch<{ url?: string }>('/api/auth/callback/credentials', {
      method: 'POST',
      headers: { 'X-Auth-Return-Redirect': '1' },
      body: { email: registerEmail.value, password: registerPassword.value, csrfToken, callbackUrl: '/' },
      credentials: 'include',
    })
    const redirectUrl = signInResult?.url ?? ''
    if (redirectUrl.includes('/error') || redirectUrl.includes('error=')) {
      toast.error(t('auth.register.error.generic'))
      return
    }
    await fetchSession()
    const redirect = pendingRedirect.value
    close()
    toast.success(t('auth.register.success'))
    if (redirect) await navigateTo(redirect)
  } catch (e: unknown) {
    const error = e as { data?: { message?: string }; message?: string }
    const msg = error?.data?.message ?? error?.message ?? ''
    toast.error(msg === 'EMAIL_TAKEN' ? t('auth.register.error.emailTaken') : msg || t('auth.register.error.generic'))
  } finally {
    registerLoading.value = false
  }
}
</script>

<template>
  <UiDialog :open="isOpen" @update:open="(open: boolean) => !open && close()">
    <UiDialogPortal>
      <UiDialogOverlay class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
      <UiDialogContent
        class="overflow-hidden max-w-sm p-0 border-0 rounded-2xl shadow-[0_0_30px_-8px_rgba(0,0,0,0.12)] bg-background dark:bg-card/80 dark:backdrop-blur-md dark:border dark:border-border"
      >
        <!-- Accessibility: visually hidden title and description -->
        <UiDialogTitle class="sr-only">
          {{ activeTab === 'login' ? t('auth.modal.loginTab') : t('auth.modal.registerTab') }}
        </UiDialogTitle>
        <UiDialogDescription class="sr-only">
          {{ activeTab === 'login' ? t('auth.login.subtitle') : t('auth.register.subtitle') }}
        </UiDialogDescription>

        <!-- Background image overlay -->
        <div
          class="absolute inset-0 bg-cover bg-center pointer-events-none"
          :style="`background-image: url('/imgs/${activeTab === 'login' ? 'login_bg.jpg' : 'sign_up.jpg'}'); opacity: 0.2;`"
          aria-hidden="true"
        />

        <!-- Modal content -->
        <div class="relative z-10">
          <!-- Tab switcher -->
          <div class="flex border-b border-border">
            <button
              type="button"
              class="flex-1 py-3 text-sm font-medium font-heading transition-colors border-b-2 -mb-px cursor-pointer"
              :class="activeTab === 'login' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'"
              @click="activeTab = 'login'"
            >
              {{ t('auth.modal.loginTab') }}
            </button>
            <button
              type="button"
              class="flex-1 py-3 text-sm font-medium font-heading transition-colors border-b-2 -mb-px cursor-pointer"
              :class="activeTab === 'register' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'"
              @click="activeTab = 'register'"
            >
              {{ t('auth.modal.registerTab') }}
            </button>
          </div>

          <div class="p-6">
            <!-- Login panel -->
            <div v-if="activeTab === 'login'">
              <div class="mb-5">
                <h2 class="text-lg font-heading font-semibold text-foreground">{{ t('auth.login.title') }}</h2>
                <p class="text-sm text-muted-foreground mt-0.5">{{ t('auth.login.subtitle') }}</p>
              </div>

              <form class="space-y-4" @submit.prevent="onLoginSubmit">
                <!-- Email -->
                <div>
                  <UiLabel for="login-email" class="sr-only">{{ t('auth.login.email') }}</UiLabel>
                  <UiInput
                    id="login-email"
                    v-model="loginEmail"
                    type="text"
                    inputmode="email"
                    :placeholder="t('auth.login.email')"
                    autocomplete="email"
                  />
                  <p v-if="loginErrors.email" class="text-xs text-destructive mt-1">{{ loginErrors.email }}</p>
                </div>

                <!-- Password -->
                <div>
                  <UiLabel for="login-password" class="sr-only">{{ t('auth.login.password') }}</UiLabel>
                  <UiInput
                    id="login-password"
                    v-model="loginPassword"
                    type="password"
                    :placeholder="t('auth.login.password')"
                    autocomplete="current-password"
                  />
                  <p v-if="loginErrors.password" class="text-xs text-destructive mt-1">{{ loginErrors.password }}</p>
                </div>

                <!-- Submit -->
                <UiButton type="submit" class="w-full" :disabled="loginLoading">
                  {{ loginLoading ? t('auth.login.submitting') : t('auth.login.submit') }}
                </UiButton>
              </form>

              <!-- Divider -->
              <div class="my-4 border-t border-border" />

              <!-- Google login -->
              <UiButton type="button" variant="outline" class="w-full gap-2" @click="onGoogleLogin">
                <svg class="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {{ t('auth.login.google') }}
              </UiButton>

              <!-- Switch to register -->
              <p class="text-center text-sm text-muted-foreground mt-4">
                {{ t('auth.login.noAccount') }}
                <button
                  type="button"
                  class="text-primary font-medium hover:underline cursor-pointer"
                  @click="activeTab = 'register'"
                >
                  {{ t('auth.login.registerLink') }}
                </button>
              </p>
            </div>

            <!-- Register panel -->
            <div v-else>
              <div class="mb-5">
                <h2 class="text-lg font-heading font-semibold text-foreground">{{ t('auth.register.title') }}</h2>
                <p class="text-sm text-muted-foreground mt-0.5">{{ t('auth.register.subtitle') }}</p>
              </div>

              <form class="space-y-4" @submit.prevent="onRegisterSubmit">
                <!-- Name -->
                <div>
                  <UiLabel for="register-name" class="sr-only">{{ t('auth.name') }}</UiLabel>
                  <UiInput
                    id="register-name"
                    v-model="registerName"
                    type="text"
                    :placeholder="t('auth.name')"
                    autocomplete="name"
                  />
                  <p v-if="registerErrors.name" class="text-xs text-destructive mt-1">{{ registerErrors.name }}</p>
                </div>

                <!-- Email -->
                <div>
                  <UiLabel for="register-email" class="sr-only">{{ t('auth.register.email') }}</UiLabel>
                  <UiInput
                    id="register-email"
                    v-model="registerEmail"
                    type="text"
                    inputmode="email"
                    :placeholder="t('auth.register.email')"
                    autocomplete="email"
                  />
                  <p v-if="registerErrors.email" class="text-xs text-destructive mt-1">{{ registerErrors.email }}</p>
                </div>

                <!-- Password -->
                <div>
                  <UiLabel for="register-password" class="sr-only">{{ t('auth.register.password') }}</UiLabel>
                  <UiInput
                    id="register-password"
                    v-model="registerPassword"
                    type="password"
                    :placeholder="t('auth.register.password')"
                    autocomplete="new-password"
                  />
                  <p v-if="registerErrors.password" class="text-xs text-destructive mt-1">{{ registerErrors.password }}</p>
                </div>

                <!-- Submit -->
                <UiButton type="submit" class="w-full" :disabled="registerLoading">
                  {{ registerLoading ? t('auth.register.submitting') : t('auth.register.submit') }}
                </UiButton>
              </form>

              <!-- Divider -->
              <div class="my-4 border-t border-border" />

              <!-- Google signup -->
              <UiButton type="button" variant="outline" class="w-full gap-2" @click="onGoogleLogin">
                <svg class="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {{ t('auth.register.google') }}
              </UiButton>

              <!-- Switch to login -->
              <p class="text-center text-sm text-muted-foreground mt-4">
                {{ t('auth.register.hasAccount') }}
                <button
                  type="button"
                  class="text-primary font-medium hover:underline cursor-pointer"
                  @click="activeTab = 'login'"
                >
                  {{ t('auth.register.loginLink') }}
                </button>
              </p>
            </div>
          </div>
        </div>
      </UiDialogContent>
    </UiDialogPortal>
  </UiDialog>
</template>
