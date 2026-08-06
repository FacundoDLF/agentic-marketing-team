<script setup lang="ts">
/**
 * AppTopbar — Top navigation bar with search and user actions.
 *
 * Receives the page title as a prop from the layout.
 *
 * FSD layer: shared/ui
 */
import { Search, Bell } from '@lucide/vue'

defineProps<{
  title: string
}>()
</script>

<template>
  <header
    class="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-border bg-background/80 px-4 backdrop-blur md:px-6"
  >
    <!-- Mobile brand (visible only on small screens) -->
    <div class="flex flex-col md:hidden">
      <span class="text-sm font-semibold">Marketing AI</span>
    </div>

    <!-- Page title (visible on md+) -->
    <h1 class="hidden text-lg font-semibold tracking-tight md:block">
      {{ title }}
    </h1>

    <!-- Search input -->
    <div class="relative ml-auto w-full max-w-sm">
      <Search
        class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
      />
      <input
        id="global-search"
        type="search"
        placeholder="Buscar noticias, leads, copys..."
        aria-label="Búsqueda global"
        class="h-9 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30"
      />
    </div>

    <!-- Notifications button -->
    <button
      id="btn-notifications"
      type="button"
      aria-label="Notificaciones"
      class="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-input bg-card text-muted-foreground transition-colors hover:text-foreground"
    >
      <Bell class="h-[18px] w-[18px]" />
      <span
        class="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive ring-2 ring-card"
      />
    </button>

    <!-- User avatar -->
    <button
      id="btn-user-avatar"
      type="button"
      aria-label="Perfil de usuario"
      class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
    >
      JD
    </button>
  </header>
</template>
