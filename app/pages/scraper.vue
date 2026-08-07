<script setup lang="ts">
import { SatelliteDishIcon } from '@lucide/vue'
import { AGENTS } from '~~/shared/constants/agents'
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border bg-card p-16">
    <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-accent-foreground">
      <SatelliteDishIcon class="h-6 w-6" />
    </div>
    <h2 class="text-lg font-semibold">Radar de Tendencias ({{ AGENTS.SCRAPY.name }})</h2>
    <p class="max-w-md text-center text-sm text-muted-foreground">
      Rastrea fuentes de noticias y detecta tendencias relevantes para tu marca automáticamente.
    </p>
  </div>
</template>
