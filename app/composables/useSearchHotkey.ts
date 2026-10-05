const searchInputs = new Set<HTMLInputElement>()

export function registerSearchInput(input: HTMLInputElement) {
  searchInputs.add(input)
}

export function unregisterSearchInput(input: HTMLInputElement) {
  searchInputs.delete(input)
}

export function topmostSearchInput() {
  for (const input of searchInputs) {
    if (isOnTop(input)) return input
  }
  return null
}

function isOnTop(input: HTMLInputElement) {
  const rect = input.getBoundingClientRect()
  if (rect.width === 0 || rect.height === 0) return false
  const x = Math.min(Math.max(rect.left + rect.width / 2, 0), window.innerWidth - 1)
  const y = Math.min(Math.max(rect.top + rect.height / 2, 0), window.innerHeight - 1)
  const top = document.elementFromPoint(x, y)
  if (!top) return false
  return top === input || input.contains(top)
}
