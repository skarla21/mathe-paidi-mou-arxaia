<script setup lang="ts">
import { ref, watch, computed, onMounted, onUnmounted } from 'vue'
import { toast } from 'vue-sonner'
import { registerSearchInput, topmostSearchInput, unregisterSearchInput } from '~/composables/useSearchHotkey'
import UiPopover from '~/components/ui/popover/Popover.vue'
import UiPopoverAnchor from '~/components/ui/popover/PopoverAnchor.vue'
import UiPopoverContent from '~/components/ui/popover/PopoverContent.vue'

interface SearchResult {
  type: 'chapter' | 'lesson'
  id: string
  title: string
  url: string
}

const props = withDefaults(defineProps<{
  class?: string
  hotkey?: boolean
  size?: 'md' | 'lg'
}>(), {
  size: 'md',
  hotkey: false,
})
const rootRef = ref<HTMLElement | null>(null)
const query = ref('')
const results = ref<SearchResult[]>([])
const loading = ref(false)
const open = ref(false)
const debounceMs = 300
let debounceTimer: ReturnType<typeof setTimeout> | null = null


async function search() {
  const q = query.value.trim()
  if (!q) {
    results.value = []
    open.value = false
    return
  }
  loading.value = true
  try {
    const data = await $fetch<SearchResult[]>('/api/search', { params: { q } })
    results.value = data ?? []
    open.value = true
  } catch {
    results.value = []
    toast.error('Αποτυχία αναζήτησης')
  } finally {
    loading.value = false
  }
}

watch(query, () => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(search, debounceMs)
})

function close() {
  open.value = false
}

function onFocus() {
  if (query.value.trim()) {
    open.value = true
  }
}

const placeholder = computed(() => 'Αναζήτηση υλικού...')

let registeredInput: HTMLInputElement | null = null

function onHotkey(event: KeyboardEvent) {
  if (event.repeat) return
  if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'k') return
  const target = topmostSearchInput()
  if (!target) return
  event.preventDefault()
  target.focus()
  target.select()
}

onMounted(() => {
  registeredInput = rootRef.value?.querySelector('input') ?? null
  if (registeredInput) registerSearchInput(registeredInput)
  if (!props.hotkey || !import.meta.client) return
  window.addEventListener('keydown', onHotkey)
})

onUnmounted(() => {
  if (debounceTimer) clearTimeout(debounceTimer)
  if (registeredInput) unregisterSearchInput(registeredInput)
  if (props.hotkey && import.meta.client) window.removeEventListener('keydown', onHotkey)
})
</script>

<template>
  <UiPopover v-model:open="open">
    <UiPopoverAnchor as-child>
      <div ref="rootRef" :class="props.class">
      <div class="flex w-full items-center gap-2 rounded-full border border-border bg-secondary px-3.5 shadow-sm transition-all hover:bg-muted focus-within:bg-card focus-within:ring-2 focus-within:ring-primary/30">
        <VIcon
          name="bi-search"
          aria-hidden="true"
          class="size-4 shrink-0 text-muted-foreground pointer-events-none"
        />
        <input
          v-model="query"
          type="search"
          :placeholder="placeholder"
          aria-label="Αναζήτηση υλικού..."
          class="w-full bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none border-none"
          :class="props.size === 'lg' ? 'h-12 text-base' : 'h-9 text-[13.5px]'"
          @focus="onFocus"
        >
        <kbd
          v-if="props.hotkey"
          class="hidden lg:inline-flex shrink-0 rounded-full border border-border bg-card px-1.5 py-0.5 text-[11px] text-muted-foreground pointer-events-none"
        >
          Ctrl K
        </kbd>
      </div>
      </div>
    </UiPopoverAnchor>
    <UiPopoverContent
      class="w-max min-w-(--radix-popover-trigger-width) max-w-[min(36rem,calc(100vw-2rem))] max-h-80 overflow-x-hidden overflow-y-auto rounded-2xl border-border p-2 shadow-lg"
      align="start"
      :side-offset="4"
      prioritize-position
      :collision-padding="16"
    >
      <p v-if="loading" class="px-2 py-2 text-sm text-muted-foreground">
        Γίνεται αναζήτηση...
      </p>
      <div role="listbox" aria-label="Αναζήτηση υλικού...">
        <NuxtLink
          v-for="r in results"
          :key="`${r.type}-${r.id}`"
          role="option"
          :to="r.url"
          class="flex w-full min-w-0 items-center gap-3 rounded-xl px-2 py-2 hover:bg-secondary focus-visible:bg-secondary"
          @click="close"
        >
          <UiIconWell>
            <VIcon
              :name="r.type === 'chapter' ? 'bi-journal-bookmark' : 'bi-journal-text'"
              class="size-4"
              aria-hidden="true"
            />
          </UiIconWell>
          <span class="min-w-0">
            <span class="block truncate text-sm font-semibold leading-tight">
              {{ r.title }}
            </span>
            <span class="mt-0.5 block text-xs text-muted-foreground">
              {{ r.type === 'chapter' ? 'Κεφάλαιο' : 'Υλικό' }}
            </span>
          </span>
        </NuxtLink>
      </div>
      <p
        v-if="!loading && results.length === 0 && query.trim()"
        class="px-2 py-2 text-center text-sm text-muted-foreground"
      >
        Δεν βρέθηκαν αποτελέσματα
      </p>
    </UiPopoverContent>
  </UiPopover>
</template>
