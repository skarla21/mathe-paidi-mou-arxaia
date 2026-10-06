export function catalogContentState(input: {
  chapterCount: number
  lessonCount: number
  chaptersPending: boolean
  lessonsPending: boolean
  chaptersError: boolean
  lessonsError: boolean
}) {
  const hasChapters = input.chapterCount > 0
  const hasLessons = input.lessonCount > 0
  const chaptersPending = input.chaptersPending && !hasChapters
  const lessonsPending = input.lessonsPending && !hasLessons
  const showInitialLoading = chaptersPending && lessonsPending
  const showBlockedError = !hasChapters && !hasLessons && !chaptersPending && !lessonsPending
    && input.chaptersError && input.lessonsError

  return {
    showInitialLoading,
    showBlockedError,
    showChapters: hasChapters,
    showLessons: hasLessons,
    chaptersPending: chaptersPending && !showInitialLoading,
    lessonsPending: lessonsPending && !showInitialLoading,
    showChapterError: !hasChapters && input.chaptersError && !chaptersPending && !showBlockedError,
    showLessonError: !hasLessons && input.lessonsError && !lessonsPending && !showBlockedError,
    showEmpty: !hasChapters && !hasLessons && !chaptersPending && !lessonsPending
      && !input.chaptersError && !input.lessonsError,
  }
}
