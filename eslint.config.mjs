// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  rules: {
    // Dynamic Supabase data in admin pages makes `any` pragmatic; keep visible as warning
    '@typescript-eslint/no-explicit-any': 'warn',
    // False positive with TypeScript optional props (`?`) — Vue 3 TS already implies undefined
    'vue/require-default-prop': 'off',
    // Rendered from trusted server-generated HTML (lesson content)
    'vue/no-v-html': 'warn',
  },
})
