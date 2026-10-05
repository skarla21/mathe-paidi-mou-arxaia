<script setup lang="ts">
import 'vue-sonner/style.css'
import { Toaster } from 'vue-sonner'
import LayoutAppHeader from '~/components/layout/AppHeader.vue'
import LayoutAppFooter from '~/components/layout/AppFooter.vue'

const theme = useTheme()
const route = useRoute()
const hideLayoutFooter = computed(() => !!route.meta['hideLayoutFooter'])

onMounted(() => {
  theme.init()
})
</script>

<template>
  <div class="min-h-screen flex flex-col bg-background text-foreground">
    <Toaster />
    <AuthModal />
    <EditProfileModal />
    <LayoutAppHeader />
    <main class="flex-1 flex flex-col w-full">
      <div class="flex-1 flex flex-col">
        <slot />
      </div>
      <LayoutAppFooter v-if="!hideLayoutFooter" />
    </main>
  </div>
</template>
