<script setup lang="ts">
import UiDialog from '~/components/ui/dialog/Dialog.vue'
import UiDialogPortal from '~/components/ui/dialog/DialogPortal.vue'
import UiDialogOverlay from '~/components/ui/dialog/DialogOverlay.vue'
import UiDialogContent from '~/components/ui/dialog/DialogContent.vue'
import UiDialogHeader from '~/components/ui/dialog/DialogHeader.vue'
import UiDialogFooter from '~/components/ui/dialog/DialogFooter.vue'
import UiDialogTitle from '~/components/ui/dialog/DialogTitle.vue'
import UiButton from '~/components/ui/Button.vue'
import UiAlertDialogRoot from '~/components/ui/alert-dialog/AlertDialogRoot.vue'
import UiAlertDialogPortal from '~/components/ui/alert-dialog/AlertDialogPortal.vue'
import UiAlertDialogOverlay from '~/components/ui/alert-dialog/AlertDialogOverlay.vue'
import UiAlertDialogContent from '~/components/ui/alert-dialog/AlertDialogContent.vue'
import UiAlertDialogHeader from '~/components/ui/alert-dialog/AlertDialogHeader.vue'
import UiAlertDialogFooter from '~/components/ui/alert-dialog/AlertDialogFooter.vue'
import UiAlertDialogTitle from '~/components/ui/alert-dialog/AlertDialogTitle.vue'
import UiAlertDialogDescription from '~/components/ui/alert-dialog/AlertDialogDescription.vue'
import UiAlertDialogCancel from '~/components/ui/alert-dialog/AlertDialogCancel.vue'
import UiAlertDialogAction from '~/components/ui/alert-dialog/AlertDialogAction.vue'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { toast } from 'vue-sonner'
import type { LessonRating, LessonComment } from '~/types/database'

const props = defineProps<{ open: boolean; lessonId: string | null }>()
const emit = defineEmits<{ close: [] }>()
const adminFetch = useAdminFetch()

const ratings = ref<LessonRating[]>([])
const comments = ref<LessonComment[]>([])
const loading = ref(false)

// Delete confirmation state — a single dialog reused for both ratings and comments
type PendingDelete = { kind: 'rating'; id: string } | { kind: 'comment'; id: string }
const pendingDelete = ref<PendingDelete | null>(null)
const deleteDialogOpen = ref(false)
const deleteLoading = ref(false)

const avgRating = computed<number>(() => {
  if (!ratings.value.length) return 0
  const sum = ratings.value.reduce((acc, r) => acc + r.rating, 0)
  return Math.round((sum / ratings.value.length) * 10) / 10
})

watch(() => props.open, async (val) => {
  if (!val || !props.lessonId) return
  loading.value = true
  ratings.value = []
  comments.value = []
  try {
    const [r, c] = await Promise.all([
      adminFetch<LessonRating[]>(`/api/admin/lessons/${props.lessonId}/ratings`),
      adminFetch<LessonComment[]>(`/api/admin/lessons/${props.lessonId}/comments`),
    ])
    ratings.value = r
    comments.value = c
  }
  catch { toast.error('Κάτι πήγε στραβά') }
  finally { loading.value = false }
})

function requestDeleteRating(id: string) {
  pendingDelete.value = { kind: 'rating', id }
  deleteDialogOpen.value = true
}

function requestDeleteComment(id: string) {
  pendingDelete.value = { kind: 'comment', id }
  deleteDialogOpen.value = true
}

async function confirmDelete() {
  if (!pendingDelete.value) return
  deleteLoading.value = true
  const { kind, id } = pendingDelete.value
  try {
    if (kind === 'rating') {
      await adminFetch(`/api/admin/ratings/${id}`, { method: 'DELETE' })
      ratings.value = ratings.value.filter(r => r.id !== id)
      toast.success('Η βαθμολογία διαγράφηκε')
    }
    else {
      await adminFetch(`/api/admin/comments/${id}`, { method: 'DELETE' })
      comments.value = comments.value.filter(c => c.id !== id)
      toast.success('Το σχόλιο διαγράφηκε')
    }
    deleteDialogOpen.value = false
    pendingDelete.value = null
  }
  catch {
    toast.error('Κάτι πήγε στραβά')
  }
  finally { deleteLoading.value = false }
}

function starArray(rating: number) {
  return Array.from({ length: 5 }, (_, i) => i < rating)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString()
}
</script>

<template>
  <UiDialog :open="!!props.open" @update:open="(v: boolean) => !v && emit('close')">
    <UiDialogPortal>
      <UiDialogOverlay />
      <UiDialogContent class="max-w-lg max-h-[80vh] overflow-y-auto">
        <UiDialogHeader>
          <UiDialogTitle>Λεπτομέρειες υλικού</UiDialogTitle>
        </UiDialogHeader>

        <div v-if="loading" class="py-4 text-sm text-muted-foreground">
          Φόρτωση...
        </div>

        <Tabs v-else default-value="ratings">
          <TabsList class="w-full">
            <TabsTrigger value="ratings" class="flex-1">
              Βαθμολογίες ({{ ratings.length }})
            </TabsTrigger>
            <TabsTrigger value="comments" class="flex-1">
              Σχόλια ({{ comments.length }})
            </TabsTrigger>
          </TabsList>

          <!-- Ratings tab -->
          <TabsContent value="ratings" class="mt-4 space-y-3">
            <!-- Average rating header -->
            <div v-if="ratings.length" class="flex items-center gap-2 pb-2 border-b border-border">
              <span class="text-xs font-medium text-muted-foreground">Μέση Βαθμολογία:</span>
              <span class="flex items-center gap-0.5">
                <VIcon
                  v-for="n in 5"
                  :key="n"
                  :name="n <= Math.round(avgRating) ? 'bi-star-fill' : 'bi-star'"
                  class="w-3.5 h-3.5"
                  :class="n <= Math.round(avgRating) ? 'text-yellow-400' : 'text-muted-foreground'"
                />
              </span>
              <span class="text-sm font-semibold">{{ avgRating }}</span>
              <span class="text-xs text-muted-foreground">({{ ratings.length }})</span>
            </div>

            <p v-if="!ratings.length" class="text-xs text-muted-foreground">
              Δεν υπάρχουν βαθμολογίες ακόμα.
            </p>

            <ul v-else class="space-y-2">
              <li
                v-for="rating in ratings"
                :key="rating.id"
                class="flex items-start justify-between gap-3 rounded-md bg-accent/30 px-3 py-2 text-xs"
              >
                <div class="min-w-0 flex-1 space-y-0.5">
                  <p class="font-medium truncate">
                    {{ rating.users?.name ?? rating.user_id }}
                  </p>
                  <span class="flex items-center gap-0.5">
                    <VIcon
                      v-for="(filled, idx) in starArray(rating.rating)"
                      :key="idx"
                      :name="filled ? 'bi-star-fill' : 'bi-star'"
                      class="w-3 h-3"
                      :class="filled ? 'text-yellow-400' : 'text-muted-foreground'"
                    />
                  </span>
                  <p class="text-muted-foreground">{{ formatDate(rating.created_at) }}</p>
                </div>
                <UiButton
                  variant="ghost"
                  size="icon"
                  class="h-7 w-7 shrink-0 text-destructive hover:text-destructive"
                  aria-label="Διαγραφή βαθμολογίας"
                  @click="requestDeleteRating(rating.id)"
                >
                  <VIcon name="bi-trash" class="w-3.5 h-3.5" />
                </UiButton>
              </li>
            </ul>
          </TabsContent>

          <!-- Comments tab -->
          <TabsContent value="comments" class="mt-4 space-y-2">
            <p v-if="!comments.length" class="text-xs text-muted-foreground">
              Δεν υπάρχουν σχόλια ακόμα.
            </p>

            <ul v-else class="space-y-2">
              <li
                v-for="comment in comments"
                :key="comment.id"
                class="flex items-start justify-between gap-3 rounded-md bg-accent/30 px-3 py-2 text-xs"
              >
                <div class="min-w-0 flex-1 space-y-0.5">
                  <p class="font-medium truncate">
                    {{ comment.users?.name ?? comment.user_id }}
                  </p>
                  <p class="text-foreground break-words whitespace-pre-wrap">{{ comment.body }}</p>
                  <p class="text-muted-foreground">{{ formatDate(comment.created_at) }}</p>
                </div>
                <UiButton
                  variant="ghost"
                  size="icon"
                  class="h-7 w-7 shrink-0 text-destructive hover:text-destructive"
                  aria-label="Διαγραφή σχολίου"
                  @click="requestDeleteComment(comment.id)"
                >
                  <VIcon name="bi-trash" class="w-3.5 h-3.5" />
                </UiButton>
              </li>
            </ul>
          </TabsContent>
        </Tabs>

        <UiDialogFooter class="mt-4">
          <UiButton variant="cancel" @click="emit('close')">Ακύρωση</UiButton>
        </UiDialogFooter>
      </UiDialogContent>
    </UiDialogPortal>
  </UiDialog>

  <!-- Delete confirmation alert dialog (outside main dialog portal to avoid nesting issues) -->
  <UiAlertDialogRoot v-model:open="deleteDialogOpen">
    <UiAlertDialogPortal>
      <UiAlertDialogOverlay />
      <UiAlertDialogContent>
        <UiAlertDialogHeader>
          <UiAlertDialogTitle>
            {{
              pendingDelete?.kind === 'rating'
                ? 'Διαγραφή βαθμολογίας'
                : 'Διαγραφή σχολίου'
            }}
          </UiAlertDialogTitle>
          <UiAlertDialogDescription>
            {{
              pendingDelete?.kind === 'rating'
                ? 'Είστε σίγουροι ότι θέλετε να διαγράψετε αυτήν τη βαθμολογία;'
                : 'Είστε σίγουροι ότι θέλετε να διαγράψετε αυτό το σχόλιο;'
            }}
          </UiAlertDialogDescription>
        </UiAlertDialogHeader>
        <UiAlertDialogFooter>
          <UiAlertDialogCancel>
            <UiButton variant="cancel">Ακύρωση</UiButton>
          </UiAlertDialogCancel>
          <UiAlertDialogAction as-child>
            <UiButton variant="destructive" :disabled="deleteLoading" @click="confirmDelete">
              Διαγραφή
            </UiButton>
          </UiAlertDialogAction>
        </UiAlertDialogFooter>
      </UiAlertDialogContent>
    </UiAlertDialogPortal>
  </UiAlertDialogRoot>
</template>
