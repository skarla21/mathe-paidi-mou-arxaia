<script setup lang="ts">
import { toast } from 'vue-sonner'
import UiButton from '~/components/ui/Button.vue'
import UiCard from '~/components/ui/Card.vue'
import UiCardContent from '~/components/ui/CardContent.vue'
import UiTextarea from '~/components/ui/Textarea.vue'
import UiLabel from '~/components/ui/Label.vue'
import UiSkeleton from '~/components/ui/Skeleton.vue'
import { NuxtLink } from '#components'

definePageMeta({ layout: 'default' })
const { t } = useI18n()
const route = useRoute()
const { session } = useCurrentUser()

type ArticlePayload = {
  id: string
  title: string
  body: string
  tags: string[]
  reading_time_minutes: number
  created_at: string
  likeCount: number
  commentCount: number
  likedByMe: boolean
  myComment: { id: string; body: string; updated_at: string } | null
}

type CommentRow = {
  id: string
  body: string
  created_at: string
  users?: { id: string; name: string | null; avatar_url: string | null } | null
}

const article = ref<ArticlePayload | null>(null)
const articlePending = ref(true)
const comments = ref<CommentRow[]>([])
const commentText = ref('')
const likeLoading = ref(false)
const commentLoading = ref(false)

const id = computed(() => route.params.id as string)

useHead(() => ({
  title: article.value?.title ? `${article.value.title} — ${t('articlesPage.title')}` : t('articlesPage.title'),
}))

async function loadArticle() {
  articlePending.value = true
  try {
    article.value = await $fetch<ArticlePayload>(`/api/articles/${id.value}`, { credentials: 'include' })
  } catch {
    article.value = null
    toast.error(t('common.error'))
  } finally {
    articlePending.value = false
  }
}

async function loadComments() {
  try {
    comments.value = await $fetch<CommentRow[]>(`/api/articles/${id.value}/comments`, {
      credentials: 'include',
    })
  } catch {
    comments.value = []
  }
}

onMounted(async () => {
  await loadArticle()
  await loadComments()
})

watch(id, async () => {
  commentText.value = ''
  await loadArticle()
  await loadComments()
})

watch(
  () => article.value?.myComment,
  (mc) => {
    if (mc?.body) commentText.value = mc.body
  },
  { immediate: true },
)

async function toggleLike() {
  if (!session.value?.user?.id) {
    toast.error(t('articlesPage.loginToEngage'))
    return
  }
  const a = article.value
  if (!a) return
  likeLoading.value = true
  try {
    if (a.likedByMe) {
      await $fetch(`/api/articles/${id.value}/like`, { method: 'DELETE', credentials: 'include' })
      a.likedByMe = false
      a.likeCount = Math.max(0, a.likeCount - 1)
    } else {
      await $fetch(`/api/articles/${id.value}/like`, { method: 'POST', credentials: 'include' })
      a.likedByMe = true
      a.likeCount += 1
    }
  } catch {
    toast.error(t('common.error'))
  } finally {
    likeLoading.value = false
  }
}

async function saveComment() {
  if (!session.value?.user?.id) {
    toast.error(t('articlesPage.loginToEngage'))
    return
  }
  const body = commentText.value.trim()
  if (body.length < 1 || body.length > 2000) {
    toast.error(t('common.error'))
    return
  }
  commentLoading.value = true
  try {
    await $fetch(`/api/articles/${id.value}/comment`, {
      method: 'PUT',
      credentials: 'include',
      body: { body },
    })
    await loadArticle()
    await loadComments()
    toast.success(t('articlesPage.commentSaved'))
  } catch {
    toast.error(t('common.error'))
  } finally {
    commentLoading.value = false
  }
}

async function removeComment() {
  if (!session.value?.user?.id) return
  commentLoading.value = true
  try {
    await $fetch(`/api/articles/${id.value}/comment`, { method: 'DELETE', credentials: 'include' })
    commentText.value = ''
    await loadArticle()
    await loadComments()
  } catch {
    toast.error(t('common.error'))
  } finally {
    commentLoading.value = false
  }
}

async function copyLink() {
  const url = typeof window !== 'undefined' ? window.location.href : ''
  try {
    await navigator.clipboard.writeText(url)
    toast.success(t('articlesPage.linkCopied'))
  } catch {
    toast.error(t('common.error'))
  }
}
</script>

<template>
  <div class="container max-w-3xl py-10 px-4">
    <NuxtLink to="/articles" class="text-sm text-muted-foreground hover:text-foreground mb-6 inline-block">
      {{ t('articlesPage.backToList') }}
    </NuxtLink>

    <template v-if="articlePending">
      <UiSkeleton class="h-10 w-3/4 mb-4" />
      <UiSkeleton class="h-64 w-full" />
    </template>

    <template v-else-if="!article">
      <p class="text-muted-foreground">{{ t('common.error') }}</p>
    </template>

    <template v-else>
      <header class="mb-8">
        <h1 class="text-3xl font-heading font-bold">{{ article.title }}</h1>
        <p class="text-sm text-muted-foreground mt-2">
          {{ t('articlesPage.readTime', { n: article.reading_time_minutes }) }}
        </p>
        <div v-if="article.tags?.length" class="flex flex-wrap gap-2 mt-4">
          <span
            v-for="tag in article.tags"
            :key="tag"
            class="text-xs rounded-md bg-muted px-2 py-0.5 text-muted-foreground"
          >
            {{ tag }}
          </span>
        </div>
      </header>

      <div class="prose prose-neutral dark:prose-invert max-w-none mb-10 whitespace-pre-wrap">
        {{ article.body }}
      </div>

      <div class="flex flex-wrap items-center gap-3 mb-10">
        <template v-if="session?.user?.id">
          <UiButton
            variant="outline"
            size="sm"
            :disabled="likeLoading"
            @click="toggleLike"
          >
            <VIcon :name="article.likedByMe ? 'bi-heart-fill' : 'bi-heart'" class="mr-2 size-4" />
            {{ article.likedByMe ? t('articlesPage.unlike') : t('articlesPage.like') }}
            <span class="ml-1 text-muted-foreground">({{ article.likeCount }})</span>
          </UiButton>
        </template>
        <UiButton variant="outline" size="sm" @click="copyLink">
          <VIcon name="bi-link-45deg" class="mr-2 size-4" />
          {{ t('articlesPage.share') }}
        </UiButton>
      </div>

      <UiCard v-if="session?.user?.id" class="mb-10">
        <UiCardContent class="p-6 space-y-3">
          <UiLabel>{{ t('articlesPage.commentLabel') }}</UiLabel>
          <UiTextarea v-model="commentText" :placeholder="t('articlesPage.commentPlaceholder')" class="min-h-[100px] font-mono text-sm" />
          <div class="flex gap-2">
            <UiButton size="sm" :disabled="commentLoading" @click="saveComment">{{ t('articlesPage.saveComment') }}</UiButton>
            <UiButton
              v-if="article.myComment"
              size="sm"
              variant="outline"
              :disabled="commentLoading"
              @click="removeComment"
            >
              {{ t('articlesPage.deleteComment') }}
            </UiButton>
          </div>
        </UiCardContent>
      </UiCard>
      <p v-else class="text-sm text-muted-foreground mb-10">{{ t('articlesPage.loginToEngage') }}</p>

      <section>
        <h2 class="text-lg font-heading font-semibold mb-4">{{ t('articlesPage.commentsTitle') }}</h2>
        <ul class="space-y-4">
          <li v-for="c in comments" :key="c.id" class="rounded-lg border border-border p-4 text-sm">
            <p class="font-medium">{{ c.users?.name ?? t('admin.notifications.anonymousUser') }}</p>
            <p class="mt-1 whitespace-pre-wrap">{{ c.body }}</p>
            <p class="text-xs text-muted-foreground mt-2">{{ new Date(c.created_at).toLocaleString() }}</p>
          </li>
        </ul>
        <p v-if="!comments.length" class="text-sm text-muted-foreground">{{ t('admin.commentsEmpty') }}</p>
      </section>
    </template>
  </div>
</template>
