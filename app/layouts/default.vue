<script setup lang="ts">
import 'vue-sonner/style.css'
import { Toaster, toast } from 'vue-sonner'
import LayoutAppHeader from '~/components/layout/AppHeader.vue'
import LayoutAppFooter from '~/components/layout/AppFooter.vue'

const theme = useTheme()
const { init: initI18n, t } = useI18n()
const route = useRoute()
const pendingToast = useState<string | null>('pendingToast', () => null)
const hideLayoutFooter = computed(() => !!route.meta['hideLayoutFooter'])

onMounted(() => {
  theme.init()
  initI18n()

  const pending = pendingToast.value
  if (pending) {
    pendingToast.value = null
    if (pending === 'login') toast.success(t('auth.login.successToast'))
    else if (pending === 'registered') toast.success(t('auth.register.success'))
  }
})
</script>

<template>
  <div class="h-screen flex flex-col overflow-hidden bg-background text-foreground">
    <Toaster />
    <LayoutAppHeader />
    <main class="flex-1 min-h-0 min-w-0 overflow-auto w-full flex flex-col">
      <div class="flex-1 min-h-0 flex flex-col">
        <slot />
      </div>
      <LayoutAppFooter v-if="!hideLayoutFooter" />
    </main>
  </div>
</template>
