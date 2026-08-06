<script setup lang="ts">
import { Newspaper } from '@lucide/vue'
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border bg-card p-16">
    <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-accent-foreground">
      <Newspaper class="h-6 w-6" />
    </div>
    <h2 class="text-lg font-semibold">Scraper (Agente 1)</h2>
    <p class="max-w-md text-center text-sm text-muted-foreground">
      Rastrea fuentes de noticias y detecta tendencias relevantes para tu marca automáticamente.
    </p>
  </div>
</template>
