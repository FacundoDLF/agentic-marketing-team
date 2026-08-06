<script setup lang="ts">
/**
 * PendingNewsWidget — Scraper agent (Agent 1) news approval card.
 *
 * Integrates useScraper from features/ScraperNews to trigger scans and display
 * generated multi-platform content ideas with approval/discard workflows.
 *
 * FSD Layer: widgets/pending-news
 */
import { ref, computed } from 'vue'
import {
  Check,
  X,
  Newspaper,
  RefreshCw,
  Sparkles,
  ExternalLink,
  AlertCircle,
  Loader2,
} from '@lucide/vue'
import { pendingNews, type NewsStatus } from '~~/entities/news'
import { useScraper } from '~~/features/ScraperNews'
import { cn } from '~~/shared/lib/utils'

const { loading, error, data: scraperData, triggerScraper } = useScraper()

const statuses = ref<Record<string, NewsStatus>>({})

function setStatus(id: string, status: NewsStatus): void {
  statuses.value[id] = status
}

function getItemStatus(id: string): NewsStatus {
  return statuses.value[id] ?? 'pending'
}

interface DisplayItem {
  id: string
  headline: string
  sourceUrl?: string
  contentIdea?: string
  platforms: string[]
  timeOrDate: string
}

const displayItems = computed<DisplayItem[]>(() => {
  if (scraperData.value && scraperData.value.length > 0) {
    return scraperData.value.map((idea) => ({
      id: idea.id,
      headline: idea.headline,
      sourceUrl: idea.sourceUrl,
      contentIdea: idea.contentIdea,
      platforms: idea.platforms,
      timeOrDate: 'Recién generado',
    }))
  }

  // Initial fallback mock data before first manual scan
  return pendingNews.map((n) => ({
    id: n.id,
    headline: n.headline,
    sourceUrl: undefined,
    contentIdea: undefined,
    platforms: [n.angle],
    timeOrDate: n.time,
  }))
})

const pendingCount = computed(() => {
  return displayItems.value.filter((n) => getItemStatus(n.id) === 'pending').length
})
</script>

<template>
  <section class="flex flex-col rounded-xl border border-border bg-card shadow-sm transition-all">
    <!-- Header -->
    <header class="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
      <div class="flex items-center gap-3">
        <div
          class="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground"
        >
          <Newspaper class="h-4 w-4" />
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h2 class="text-sm font-semibold">Noticias Pendientes</h2>
            <span
              v-if="!loading"
              class="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary tabular-nums"
            >
              {{ pendingCount }} nuevas
            </span>
          </div>
          <p class="text-xs text-muted-foreground">
            Generadas por el Scraper (Agente 1)
          </p>
        </div>
      </div>

      <!-- Action Button: Trigger Scraper -->
      <button
        id="btn-trigger-scraper"
        type="button"
        :disabled="loading"
        class="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow disabled:cursor-not-allowed disabled:opacity-60"
        @click="triggerScraper"
      >
        <RefreshCw :class="['h-3.5 w-3.5', loading && 'animate-spin']" />
        <span>{{ loading ? 'Escaneando...' : 'Forzar Escaneo' }}</span>
      </button>
    </header>

    <!-- Error State Alert -->
    <div
      v-if="error"
      class="mx-5 mt-4 flex items-start gap-2.5 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive"
      role="alert"
    >
      <AlertCircle class="mt-0.5 h-4 w-4 shrink-0" />
      <div class="flex-1">
        <p class="font-medium">Ocurrió un problema al ejecutar el escáner:</p>
        <p class="mt-0.5 opacity-90">{{ error }}</p>
      </div>
      <button
        type="button"
        class="shrink-0 font-semibold underline hover:opacity-80"
        @click="triggerScraper"
      >
        Reintentar
      </button>
    </div>

    <!-- Loading Skeleton State -->
    <div v-if="loading" class="flex flex-col divide-y divide-border p-5">
      <div class="flex items-center gap-2 py-3 text-xs text-muted-foreground">
        <Loader2 class="h-4 w-4 animate-spin text-primary" />
        <span>Escaneando fuentes web y estructurando ideas de contenido con IA...</span>
      </div>
      <div v-for="i in 3" :key="i" class="flex flex-col gap-2.5 py-4 animate-pulse">
        <div class="flex items-center gap-2">
          <div class="h-4 w-20 rounded bg-muted"></div>
          <div class="h-4 w-16 rounded bg-muted"></div>
        </div>
        <div class="h-4 w-full rounded bg-muted"></div>
        <div class="h-3 w-3/4 rounded bg-muted/70"></div>
        <div class="mt-1 flex gap-2">
          <div class="h-7 w-20 rounded-lg bg-muted"></div>
          <div class="h-7 w-20 rounded-lg bg-muted"></div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="displayItems.length === 0"
      class="flex flex-col items-center justify-center gap-2 px-5 py-10 text-center"
    >
      <Sparkles class="h-8 w-8 text-muted-foreground/60" />
      <p class="text-sm font-medium">No hay noticias pendientes</p>
      <p class="text-xs text-muted-foreground">
        Presiona "Forzar Escaneo" para rastrear nuevas tendencias.
      </p>
    </div>

    <!-- Data State: List of Items -->
    <ul v-else class="flex flex-col divide-y divide-border">
      <li
        v-for="item in displayItems"
        :key="item.id"
        class="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-muted/20"
      >
        <div class="flex flex-col gap-1.5">
          <!-- Metadata & Platforms Badges -->
          <div class="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            <span
              v-for="platform in item.platforms"
              :key="platform"
              class="rounded bg-muted px-1.5 py-0.5 font-medium text-foreground"
            >
              {{ platform }}
            </span>
            <span aria-hidden="true">·</span>
            <span>{{ item.timeOrDate }}</span>
            <a
              v-if="item.sourceUrl && item.sourceUrl !== '#'"
              :href="item.sourceUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1 text-xs text-primary/80 transition-colors hover:text-primary hover:underline"
            >
              <span>Fuente</span>
              <ExternalLink class="h-3 w-3" />
            </a>
          </div>

          <!-- Headline -->
          <p class="text-sm font-medium leading-snug text-pretty">
            {{ item.headline }}
          </p>

          <!-- Content Idea Preview (if generated by Agent 1) -->
          <div
            v-if="item.contentIdea"
            class="mt-1 rounded-md bg-muted/50 p-2.5 text-xs leading-relaxed text-muted-foreground whitespace-pre-line"
          >
            {{ item.contentIdea }}
          </div>
        </div>

        <!-- Approval / Discard Action Buttons -->
        <div v-if="getItemStatus(item.id) === 'pending'" class="flex items-center gap-2 pt-1">
          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-lg bg-success px-3 py-1.5 text-xs font-medium text-success-foreground transition-opacity hover:opacity-90 shadow-sm"
            @click="setStatus(item.id, 'approved')"
          >
            <Check class="h-3.5 w-3.5" />
            Aprobar
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-lg bg-destructive px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 shadow-sm"
            @click="setStatus(item.id, 'discarded')"
          >
            <X class="h-3.5 w-3.5" />
            Descartar
          </button>
        </div>

        <!-- Resolved Status Badge -->
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

