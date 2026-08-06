<script setup lang="ts">
/**
 * Default Layout — Base shell for the application.
 *
 * Composes AppSidebar + AppTopbar around the page content.
 * Computes the page title from the current route using tabMeta.
 */
import AppSidebar from '~~/shared/ui/AppSidebar.vue'
import AppTopbar from '~~/shared/ui/AppTopbar.vue'
import { tabMeta, resolveTabId } from '~~/shared/config/navigation'

const route = useRoute()

const pageTitle = computed(() => {
  const tabId = resolveTabId(route.path)
  return tabMeta[tabId]?.title ?? 'Dashboard'
})
</script>

<template>
  <div class="flex min-h-screen bg-background text-foreground">
    <AppSidebar />

    <div class="flex min-w-0 flex-1 flex-col">
      <AppTopbar :title="pageTitle" />

      <main class="flex-1 p-4 md:p-6">
        <slot />
      </main>
    </div>
  </div>
</template>
