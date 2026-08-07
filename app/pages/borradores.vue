<script setup lang="ts">
import { FileText } from '@lucide/vue'
import { AGENTS } from '~~/shared/constants/agents'
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border bg-card p-16">
    <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-accent-foreground">
      <FileText class="h-6 w-6" />
    </div>
    <h2 class="text-lg font-semibold">Borradores ({{ AGENTS.COPPY_HOOK.name }})</h2>
    <p class="max-w-md text-center text-sm text-muted-foreground">
      Genera y edita copys para redes sociales, listos para tu revisión y aprobación.
    </p>
  </div>
</template>
