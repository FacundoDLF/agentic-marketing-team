<script setup lang="ts">
import { LayoutDashboard } from '@lucide/vue'
import { SECTIONS } from '~~/shared/constants'
</script>

<template>
  <div
    class="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border bg-card p-16 text-center"
  >
    <div
      class="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-accent-foreground shadow-xs"
    >
      <LayoutDashboard class="h-6 w-6 text-primary" />
    </div>
    <h2 class="text-lg font-semibold text-foreground">
      Dashboard: Métricas y Estadísticas Generales (Próximamente)
    </h2>
    <p class="max-w-md text-sm text-muted-foreground">
      {{ SECTIONS.DASHBOARD.description }}
    </p>
  </div>
</template>
