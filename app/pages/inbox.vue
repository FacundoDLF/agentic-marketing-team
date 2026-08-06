<script setup lang="ts">
import { MessageSquare } from '@lucide/vue'
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border bg-card p-16">
    <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-accent-foreground">
      <MessageSquare class="h-6 w-6" />
    </div>
    <h2 class="text-lg font-semibold">Social Inbox (Agente 5)</h2>
    <p class="max-w-md text-center text-sm text-muted-foreground">
      Centraliza mensajes y comentarios de todas tus redes sociales en una sola bandeja.
    </p>
  </div>
</template>
