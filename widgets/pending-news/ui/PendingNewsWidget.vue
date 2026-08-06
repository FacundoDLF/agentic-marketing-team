<script setup lang="ts">
/**
 * PendingNewsWidget — Scraper agent (Agent 1) news approval card.
 *
 * FSD Layer: widgets/pending-news
 */
import { ref, computed } from 'vue'
import { Check, X, Newspaper } from '@lucide/vue'
import { pendingNews, type NewsStatus } from '~~/entities/news'
import { cn } from '~~/shared/lib/utils'

const statuses = ref<Record<string, NewsStatus>>({})

function setStatus(id: string, status: NewsStatus): void {
  statuses.value[id] = status
}

function getItemStatus(id: string): NewsStatus {
  return statuses.value[id] ?? 'pending'
}

const pendingCount = computed(() => {
  return pendingNews.filter((n) => getItemStatus(n.id) === 'pending').length
})
</script>

<template>
  <section class="flex flex-col rounded-xl border border-border bg-card">
    <header class="flex items-center gap-2 border-b border-border px-5 py-4">
      <div
        class="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground"
      >
        <Newspaper class="h-4 w-4" />
      </div>
      <div>
        <h2 class="text-sm font-semibold">Noticias Pendientes</h2>
        <p class="text-xs text-muted-foreground">
          Generadas por el Scraper (Agente 1)
        </p>
      </div>
      <span
        class="ml-auto rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary tabular-nums"
      >
        {{ pendingCount }} nuevas
      </span>
    </header>

    <ul class="flex flex-col divide-y divide-border">
      <li
        v-for="item in pendingNews"
        :key="item.id"
        class="flex flex-col gap-3 px-5 py-4"
      >
        <div class="flex flex-col gap-1.5">
          <div class="flex items-center gap-2 text-xs text-muted-foreground">
            <span class="rounded bg-muted px-1.5 py-0.5 font-medium">
              {{ item.angle }}
            </span>
            <span>{{ item.source }}</span>
            <span aria-hidden="true">·</span>
            <span>{{ item.time }}</span>
          </div>
          <p class="text-sm font-medium leading-snug text-pretty">
            {{ item.headline }}
          </p>
        </div>

        <div v-if="getItemStatus(item.id) === 'pending'" class="flex items-center gap-2">
          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-lg bg-success px-3 py-1.5 text-xs font-medium text-success-foreground transition-opacity hover:opacity-90"
            @click="setStatus(item.id, 'approved')"
          >
            <Check class="h-3.5 w-3.5" />
            Aprobar
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-lg bg-destructive px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
            @click="setStatus(item.id, 'discarded')"
          >
            <X class="h-3.5 w-3.5" />
            Descartar
          </button>
        </div>

        <span
          v-else
          :class="
            cn(
              'inline-flex w-fit items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium',
              getItemStatus(item.id) === 'approved'
                ? 'bg-success/10 text-success'
                : 'bg-destructive/10 text-destructive',
            )
          "
        >
          <template v-if="getItemStatus(item.id) === 'approved'">
            <Check class="h-3.5 w-3.5" /> Aprobada
          </template>
          <template v-else>
            <X class="h-3.5 w-3.5" /> Descartada
          </template>
        </span>
      </li>
    </ul>
  </section>
</template>
