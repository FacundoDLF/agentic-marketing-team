<script setup lang="ts">
import { Bot } from '@lucide/vue'
import { SECTIONS } from '~~/shared/constants'
</script>

<template>
  <div
    class="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border bg-card p-16"
  >
    <div
      class="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-accent-foreground"
    >
      <Bot class="h-6 w-6" />
    </div>
    <h2 class="text-lg font-semibold">{{ SECTIONS.ORQUESTADOR.pageTitle }}</h2>
    <p class="max-w-md text-center text-sm text-muted-foreground">
      {{ SECTIONS.ORQUESTADOR.description }}
    </p>
  </div>
</template>
