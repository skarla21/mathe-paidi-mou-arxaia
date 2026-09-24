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

import type { Purchase, Download, LessonRating, LessonComment, ArticleLike, ArticleComment } from '~/types/database'

const props = defineProps<{ open: boolean; userId: string | null }>()
const emit = defineEmits<{ close: [] }>()
const { t } = useI18n()
const adminFetch = useAdminFetch()

const purchases = ref<Purchase[]>([])
const downloads = ref<Download[]>([])
const ratings = ref<LessonRating[]>([])
const comments = ref<LessonComment[]>([])
const articleLikes = ref<ArticleLike[]>([])
const articleComments = ref<ArticleComment[]>([])
const loading = ref(false)

type PendingDelete =
  | { kind: 'rating'; id: string }
  | { kind: 'comment'; id: string }
  | { kind: 'article_like'; id: string }
  | { kind: 'article_comment'; id: string }
const pendingDelete = ref<PendingDelete | null>(null)
const deleteDialogOpen = ref(false)
const deleteLoading = ref(false)

watch(() => props.open, async (val) => {
  if (!val || !props.userId) return
  loading.value = true
  try {
    const [p, d, r, c, al, ac] = await Promise.all([
      adminFetch<Purchase[]>(`/api/admin/users/${props.userId}/purchases`),
      adminFetch<Download[]>(`/api/admin/users/${props.userId}/downloads`),
      adminFetch<LessonRating[]>(`/api/admin/users/${props.userId}/ratings`),
      adminFetch<LessonComment[]>(`/api/admin/users/${props.userId}/comments`),
      adminFetch<ArticleLike[]>(`/api/admin/users/${props.userId}/article-likes`),
      adminFetch<ArticleComment[]>(`/api/admin/users/${props.userId}/article-comments`),
    ])
    purchases.value = p
    downloads.value = d
    ratings.value = r
    comments.value = c
    articleLikes.value = al
    articleComments.value = ac
  } catch { toast.error(t('common.error')) }
  finally { loading.value = false }
})

function requestDelete(kind: PendingDelete['kind'], id: string) {
  pendingDelete.value = { kind, id } as PendingDelete
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
      toast.success(t('admin.ratingDeleted'))
    } else if (kind === 'comment') {
      await adminFetch(`/api/admin/comments/${id}`, { method: 'DELETE' })
      comments.value = comments.value.filter(c => c.id !== id)
      toast.success(t('admin.commentDeleted'))
    } else if (kind === 'article_like') {
      await adminFetch(`/api/admin/article-likes/${id}`, { method: 'DELETE' })
      articleLikes.value = articleLikes.value.filter(x => x.id !== id)
      toast.success(t('admin.articleLikeRemoved'))
    } else {
      await adminFetch(`/api/admin/article-comments/${id}`, { method: 'DELETE' })
      articleComments.value = articleComments.value.filter(x => x.id !== id)
      toast.success(t('admin.commentDeleted'))
    }
    deleteDialogOpen.value = false
    pendingDelete.value = null
  } catch {
    toast.error(t('common.error'))
  } finally { deleteLoading.value = false }
}
</script>

<template>
  <UiDialog :open="!!props.open" @update:open="(v: boolean) => !v && emit('close')">
    <UiDialogPortal>
      <UiDialogOverlay />
      <UiDialogContent class="w-fit min-w-[min(32rem,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] max-h-[80vh] overflow-x-hidden overflow-y-auto">
        <UiDialogHeader class="min-w-0">
          <UiDialogTitle>{{ t('admin.userDetails') }}</UiDialogTitle>
        </UiDialogHeader>
        <div v-if="loading" class="py-4 text-sm text-muted-foreground">{{ t('common.loading') }}</div>
        <Tabs v-else default-value="downloads" class="min-w-0 max-w-full">
          <TabsList class="w-max max-w-full overflow-x-auto">
            <TabsTrigger value="downloads" class="flex-1 text-xs">
              {{ t('admin.field.downloads') }} ({{ downloads.length }})
            </TabsTrigger>
            <TabsTrigger value="purchases" class="flex-1 text-xs">
              {{ t('admin.field.purchases') }} ({{ purchases.length }})
            </TabsTrigger>
            <TabsTrigger value="ratings" class="flex-1 text-xs">
              {{ t('admin.field.ratings') }} ({{ ratings.length }})
            </TabsTrigger>
            <TabsTrigger value="comments" class="flex-1 text-xs">
              {{ t('admin.field.comments') }} ({{ comments.length }})
            </TabsTrigger>
            <TabsTrigger value="articleLikes" class="flex-1 text-xs">
              {{ t('admin.field.articleLikes') }} ({{ articleLikes.length }})
            </TabsTrigger>
            <TabsTrigger value="articleComments" class="flex-1 text-xs">
              {{ t('admin.field.articleComments') }} ({{ articleComments.length }})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="downloads" class="mt-4">
            <p v-if="!downloads.length" class="text-xs text-muted-foreground">{{ t('common.empty') }}</p>
            <ul v-else class="text-xs space-y-1">
              <li v-for="d in downloads" :key="d.id" class="flex justify-between gap-2">
                <span>{{ d.lessons?.title }}</span>
                <span class="text-muted-foreground shrink-0">{{ new Date(d.downloaded_at).toLocaleDateString() }}</span>
              </li>
            </ul>
          </TabsContent>

          <TabsContent value="purchases" class="mt-4">
            <p v-if="!purchases.length" class="text-xs text-muted-foreground">{{ t('common.empty') }}</p>
            <ul v-else class="text-xs space-y-1">
              <li v-for="p in purchases" :key="p.id" class="flex justify-between gap-2">
                <span>{{ p.lessons?.title }}</span>
                <span class="text-muted-foreground shrink-0">{{ new Date(p.created_at).toLocaleDateString() }}</span>
              </li>
            </ul>
          </TabsContent>

          <TabsContent value="ratings" class="mt-4">
            <p v-if="!ratings.length" class="text-xs text-muted-foreground">{{ t('admin.ratingsEmpty') }}</p>
            <ul v-else class="text-xs space-y-2">
              <li v-for="r in ratings" :key="r.id" class="flex items-center justify-between gap-2">
                <div class="flex flex-col gap-0.5 min-w-0">
                  <span class="truncate">{{ r.lessons?.title }}</span>
                  <span class="flex items-center gap-0.5">
                    <template v-for="i in 5" :key="i">
                      <VIcon
                        :name="i <= r.rating ? 'bi-star-fill' : 'bi-star'"
                        class="w-3 h-3"
                        :class="i <= r.rating ? 'text-yellow-400' : 'text-muted-foreground'"
                      />
                    </template>
                  </span>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                  <span class="text-muted-foreground">{{ new Date(r.created_at).toLocaleDateString() }}</span>
                  <UiButton
                    variant="ghost"
                    size="icon"
                    class="h-7 w-7 shrink-0 text-destructive hover:text-destructive"
                    :aria-label="t('admin.deleteRating')"
                    @click="requestDelete('rating', r.id)"
                  >
                    <VIcon name="bi-trash" class="w-3 h-3" />
                  </UiButton>
                </div>
              </li>
            </ul>
          </TabsContent>

          <TabsContent value="comments" class="mt-4">
            <p v-if="!comments.length" class="text-xs text-muted-foreground">{{ t('admin.commentsEmpty') }}</p>
            <ul v-else class="text-xs space-y-2">
              <li v-for="c in comments" :key="c.id" class="flex items-start justify-between gap-2">
                <div class="flex flex-col gap-0.5 min-w-0">
                  <span class="truncate font-medium">{{ c.lessons?.title }}</span>
                  <span class="text-muted-foreground line-clamp-2">{{ c.body }}</span>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                  <span class="text-muted-foreground">{{ new Date(c.created_at).toLocaleDateString() }}</span>
                  <UiButton
                    variant="ghost"
                    size="icon"
                    class="h-7 w-7 shrink-0 text-destructive hover:text-destructive"
                    :aria-label="t('admin.deleteComment')"
                    @click="requestDelete('comment', c.id)"
                  >
                    <VIcon name="bi-trash" class="w-3 h-3" />
                  </UiButton>
                </div>
              </li>
            </ul>
          </TabsContent>

          <TabsContent value="articleLikes" class="mt-4">
            <p v-if="!articleLikes.length" class="text-xs text-muted-foreground">{{ t('common.empty') }}</p>
            <ul v-else class="text-xs space-y-2">
              <li v-for="x in articleLikes" :key="x.id" class="flex items-start justify-between gap-2">
                <div class="flex flex-col gap-0.5 min-w-0">
                  <span class="truncate font-medium">{{ x.articles?.title }}</span>
                  <span class="text-muted-foreground">{{ new Date(x.created_at).toLocaleDateString() }}</span>
                </div>
                <UiButton
                  variant="ghost"
                  size="icon"
                  class="h-7 w-7 shrink-0 text-destructive hover:text-destructive"
                  :aria-label="t('admin.deleteArticleLike')"
                  @click="requestDelete('article_like', x.id)"
                >
                  <VIcon name="bi-trash" class="w-3 h-3" />
                </UiButton>
              </li>
            </ul>
          </TabsContent>

          <TabsContent value="articleComments" class="mt-4">
            <p v-if="!articleComments.length" class="text-xs text-muted-foreground">{{ t('admin.commentsEmpty') }}</p>
            <ul v-else class="text-xs space-y-2">
              <li v-for="x in articleComments" :key="x.id" class="flex items-start justify-between gap-2">
                <div class="flex flex-col gap-0.5 min-w-0">
                  <span class="truncate font-medium">{{ x.articles?.title }}</span>
                  <span class="text-muted-foreground line-clamp-2">{{ x.body }}</span>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                  <span class="text-muted-foreground">{{ new Date(x.created_at).toLocaleDateString() }}</span>
                  <UiButton
                    variant="ghost"
                    size="icon"
                    class="h-7 w-7 shrink-0 text-destructive hover:text-destructive"
                    :aria-label="t('admin.deleteComment')"
                    @click="requestDelete('article_comment', x.id)"
                  >
                    <VIcon name="bi-trash" class="w-3 h-3" />
                  </UiButton>
                </div>
              </li>
            </ul>
          </TabsContent>
        </Tabs>
        <UiDialogFooter class="mt-4 min-w-0">
          <UiButton variant="cancel" @click="emit('close')">{{ t('admin.modal.cancel') }}</UiButton>
        </UiDialogFooter>
      </UiDialogContent>
    </UiDialogPortal>
  </UiDialog>

  <UiAlertDialogRoot v-model:open="deleteDialogOpen">
    <UiAlertDialogPortal>
      <UiAlertDialogOverlay />
      <UiAlertDialogContent>
        <UiAlertDialogHeader>
          <UiAlertDialogTitle>
            {{
              pendingDelete?.kind === 'rating'
                ? t('admin.confirmDeleteRatingTitle')
                : pendingDelete?.kind === 'comment'
                  ? t('admin.confirmDeleteCommentTitle')
                  : t('admin.confirmDeleteArticleEngagementTitle')
            }}
          </UiAlertDialogTitle>
          <UiAlertDialogDescription>
            {{
              pendingDelete?.kind === 'rating'
                ? t('admin.confirmDeleteRating')
                : pendingDelete?.kind === 'comment'
                  ? t('admin.confirmDeleteComment')
                  : t('admin.confirmDeleteArticleEngagement')
            }}
          </UiAlertDialogDescription>
        </UiAlertDialogHeader>
        <UiAlertDialogFooter>
          <UiAlertDialogCancel>
            <UiButton variant="cancel">{{ t('admin.modal.cancel') }}</UiButton>
          </UiAlertDialogCancel>
          <UiAlertDialogAction as-child>
            <UiButton variant="destructive" :disabled="deleteLoading" @click="confirmDelete">
              {{ t('admin.modal.delete') }}
            </UiButton>
          </UiAlertDialogAction>
        </UiAlertDialogFooter>
      </UiAlertDialogContent>
    </UiAlertDialogPortal>
  </UiAlertDialogRoot>
</template>
