export function lessonCheckoutPath(
  paths: ReadonlyMap<string, string>,
  lessonId: string,
): string | null {
  return paths.get(lessonId) ?? null
}
