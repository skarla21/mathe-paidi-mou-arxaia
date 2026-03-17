export {}

declare module 'vue' {
  interface GlobalComponents {
    VIcon: typeof import('oh-vue-icons').OhVueIcon
  }
}
