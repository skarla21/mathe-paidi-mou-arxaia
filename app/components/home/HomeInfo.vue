<script setup lang="ts">
const cards = [
  { icon: 'bi-list-check', tint: 'bg-laurel-fixed text-laurel-fixed-foreground', linkClass: 'text-laurel', title: 'Δομημένη γνώση βήμα-βήμα', body: 'Τάξεις, μαθήματα και κεφάλαια σε σειρά. Η θεωρία και οι σημειώσεις βρίσκονται εκεί που τις περιμένεις.', link: 'Μάθε περισσότερα', href: '/about' },
  { icon: 'bi-shield-check', tint: 'bg-flame-fixed text-flame-fixed-foreground', linkClass: 'text-primary', title: 'Ασφαλές ψηφιακό σχολείο', body: 'Χωρίς διαφημίσεις. Τα αρχεία ανοίγουν μόνο για επιβεβαιωμένο λογαριασμό, και το επί πληρωμή υλικό μόνο μετά την αγορά.', link: 'Δες τις τάξεις', href: '#grades' },
  { icon: 'bi-people', tint: 'bg-amethyst-fixed text-amethyst-fixed-foreground', linkClass: 'text-amethyst', title: 'Η φιλόλογος δίπλα σου', body: 'Το υλικό το ανεβάζει και το οργανώνει η διδάσκουσα. Για ιδιαίτερα, στέλνεις μήνυμα από τη φόρμα.', link: 'Γνώρισε τη σελίδα', href: '/about' },
]
</script>

<template>
  <section id="information" class="scroll-mt-24 py-16">
    <div class="mx-auto mb-12 max-w-3xl space-y-3 text-center">
      <span class="inline-flex rounded-full bg-amethyst-fixed px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-amethyst-fixed-foreground">
        Η φιλοσοφία μας
      </span>
      <h2 class="font-heading text-3xl font-extrabold text-foreground sm:text-4xl">Τι είναι το Μάθε Παιδί μου Αρχαία;</h2>
      <p class="text-muted-foreground">Καθαρή δομή, ασφαλής χώρος και η φιλόλογος δίπλα στον μαθητή — χωρίς περισπασμούς.</p>
    </div>
    <div id="info-grid" class="grid gap-6 md:grid-cols-3">
      <article
        v-for="card in cards"
        :key="card.title"
        class="group flex flex-col justify-between rounded-3xl bg-card p-8 shadow-sm transition-shadow hover:shadow-md"
      >
        <div>
          <div class="mb-6 flex size-14 items-center justify-center rounded-2xl transition-transform group-hover:scale-110" :class="card.tint">
            <VIcon :name="card.icon" class="size-6" aria-hidden="true" />
          </div>
          <h3 class="mb-3 font-heading text-xl font-bold">{{ card.title }}</h3>
          <p class="leading-relaxed text-muted-foreground">{{ card.body }}</p>
        </div>
        <NuxtLink :to="card.href" class="mt-6 inline-flex items-center gap-1 text-sm font-bold transition-transform group-hover:translate-x-1" :class="card.linkClass">
          {{ card.link }}
          <VIcon name="bi-arrow-right" class="size-3.5" aria-hidden="true" />
        </NuxtLink>
      </article>
    </div>
  </section>
</template>
