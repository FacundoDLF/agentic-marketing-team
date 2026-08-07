<script setup lang="ts">
/**
 * PendingNewsWidget — Radar de Tendencias / Scrapy Agent (Agent 1).
 *
 * Implements Inbox Quota (max 10), Multi-State subscription ('pending_review', 'approved'),
 * dynamic status UI (approved highlight + trash archive button), and backend toast alerts.
 *
 * FSD Layer: widgets/pending-news
 */
import { ref, computed, onMounted } from 'vue'
import { marked } from 'marked'
import {
  Check,
  X,
  SatelliteDishIcon,
  RefreshCw,
  Sparkles,
  ExternalLink,
  AlertCircle,
  AlertTriangle,
  Loader2,
  Calendar,
  ChevronsDownUp,
  ChevronsUpDown,
  Info,
  Trash2,
  Link2,
} from '@lucide/vue'
import { useScraper, type ScraperTimeframe } from '~~/features/ScraperNews'
import { cn } from '~~/shared/lib/utils'

const {
  loading,
  fetchingIdeas,
  error,
  ideas,
  toastBandejaLlena,
  toastRssAgotado,
  toastUrlDuplicada,
  fetchIdeas,
  updateIdeaStatus,
  triggerScraper,
} = useScraper()

const selectedTimeframe = ref<ScraperTimeframe>('1d')
const manualUrl = ref<string>('')
const expandedItems = ref<Record<string, boolean>>({})

onMounted(() => {
  fetchIdeas()
})

function runScan() {
  triggerScraper(selectedTimeframe.value)
}

async function handleManualSubmit(): Promise<void> {
  const url = manualUrl.value.trim()
  if (!url) return
  const result = await triggerScraper({ manualUrl: url })
  if (result && result.length > 0) {
    manualUrl.value = ''
  }
}

// Computed: true si al menos un item está expandido (para toggle global)
const anyExpanded = computed(() =>
  ideas.value.some((item) => isExpanded(item.id))
)

function toggleAll(): void {
  const target = !anyExpanded.value // si alguno está abierto, colapsa todos; si no, expande todos
  const next: Record<string, boolean> = {}
  ideas.value.forEach((item) => { next[item.id] = target })
  expandedItems.value = next
}

function isExpanded(id: string): boolean {
  // Default: expanded (true) until first status change or manual toggle
  return expandedItems.value[id] !== false
}

function toggleExpand(id: string): void {
  expandedItems.value[id] = !isExpanded(id)
}

function handleApprove(id: string): void {
  updateIdeaStatus(id, 'approved')
  // Auto-colapsar al aprobar
  expandedItems.value[id] = false
}

function handleDiscard(id: string): void {
  updateIdeaStatus(id, 'rejected')
}

function handleArchive(id: string): void {
  updateIdeaStatus(id, 'archived')
}

function parseMarkdown(content?: string): string {
  if (!content) return ''
  try {
    const cleanText = content.replace(/\\n/g, '\n')
    return marked.parse(cleanText, { breaks: true, gfm: true, async: false }) as string
  } catch {
    return content
  }
}

function formatNewsDate(dateStr?: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''

  const day = String(d.getDate()).padStart(2, '0')
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ]
  const month = months[d.getMonth()]
  const year = d.getFullYear()

  return `${day} de ${month} ${year}`
}
</script>

<template>
  <section class="flex flex-col rounded-xl border border-border bg-card shadow-sm transition-all">
    <!-- Header -->
    <header class="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
      <div class="flex min-w-0 flex-1 items-center gap-3">
        <div
          class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground"
        >
          <SatelliteDishIcon class="h-4 w-4" />
        </div>
        <div class="min-w-0 flex-1">
          <h2 class="text-sm font-semibold tracking-tight text-foreground sm:text-base">Radar de Tendencias</h2>
          <p class="text-xs leading-snug text-muted-foreground sm:text-sm">
            Ideas estratégicas basadas en noticias reales. Aprobá las que te gusten para que la IA redacte los guiones finales.
          </p>
        </div>
      </div>

      <!-- Timeframe selector + Action Button (pinned to right, no wrap) -->
      <div class="flex shrink-0 items-center gap-2">
        <!-- Time Machine Select -->
        <div class="relative flex items-center">
          <Calendar class="pointer-events-none absolute left-2 h-3 w-3 text-muted-foreground" />
          <select
            id="select-timeframe"
            v-model="selectedTimeframe"
            :disabled="loading || fetchingIdeas"
            class="h-8 appearance-none rounded-lg border border-border bg-muted/40 pl-6 pr-6 text-xs text-foreground transition-colors hover:bg-muted/60 focus:outline-none focus:ring-1 focus:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="1d">Hoy (Últimas 24hs)</option>
            <option value="90d">Últimos 90 días</option>
            <option value="180d">Últimos 6 meses</option>
            <option value="next_15d">+15 días (Año anterior)</option>
            <option value="next_30d">+30 días (Año anterior)</option>
          </select>
          <svg class="pointer-events-none absolute right-1.5 h-3 w-3 text-muted-foreground" viewBox="0 0 12 12" fill="none">
            <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>

        <!-- Scan Button -->
        <button
          id="btn-trigger-scraper"
          type="button"
          :disabled="loading || fetchingIdeas"
          class="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-xs font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow disabled:cursor-not-allowed disabled:opacity-60"
          @click="runScan"
        >
          <RefreshCw :class="['h-3.5 w-3.5', loading && 'animate-spin']" />
          <span>{{ loading ? 'Escaneando...' : 'Escanear Ahora' }}</span>
        </button>
      </div>
    </header>

    <!-- Sub-bar: Inyección Manual de URL -->
    <div class="flex items-center gap-2 border-b border-border bg-muted/20 px-5 py-2.5">
      <div class="relative flex flex-1 items-center">
        <Link2 class="pointer-events-none absolute left-3 h-3.5 w-3.5 text-muted-foreground" />
        <input
          id="input-manual-url"
          v-model="manualUrl"
          type="url"
          placeholder="Pegar link de una noticia para forzar generación directa..."
          :disabled="loading || fetchingIdeas"
          class="h-8 w-full rounded-lg border border-border bg-background pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground/60 transition-colors focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-60"
          @keydown.enter.prevent="handleManualSubmit"
        />
      </div>
      <button
        id="btn-manual-url"
        type="button"
        :disabled="loading || fetchingIdeas || !manualUrl.trim()"
        class="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs font-medium text-foreground shadow-xs transition-all hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
        @click="handleManualSubmit"
      >
        <Sparkles class="h-3 w-3 text-primary" />
        <span>Generar desde Link</span>
      </button>
    </div>

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
        @click="runScan"
      >
        Reintentar
      </button>
    </div>

    <!-- Toast: Bandeja Llena -->
    <div
      v-if="toastBandejaLlena && !loading"
      class="mx-5 mt-4 flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-600 dark:text-amber-400"
      role="status"
    >
      <AlertTriangle class="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
      <p class="flex-1">
        <span class="font-semibold">Bandeja llena.</span> Aprobá o descartá ideas para hacer espacio.
      </p>
    </div>

    <!-- Toast: URL Duplicada -->
    <div
      v-if="toastUrlDuplicada && !loading"
      class="mx-5 mt-4 flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-600 dark:text-amber-400"
      role="status"
    >
      <AlertTriangle class="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
      <p class="flex-1">
        <span class="font-semibold">URL ya procesada.</span> Esta noticia ya fue analizada anteriormente y se encuentra en tu base de datos.
      </p>
    </div>

    <!-- Toast: RSS Agotado (Ya estás al día) -->
    <div
      v-if="toastRssAgotado && !loading"
      class="mx-5 mt-4 flex items-start gap-2.5 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-foreground/80"
      role="status"
    >
      <Info class="mt-0.5 h-4 w-4 shrink-0 text-primary/70" />
      <p class="flex-1">
        <span class="font-semibold">Ya estás al día.</span> No hay noticias nuevas en este período. Intentá con otro filtro o volvé más tarde.
      </p>
    </div>

    <!-- Loading Skeleton State -->
    <div v-if="loading || (fetchingIdeas && ideas.length === 0)" class="flex flex-col divide-y divide-border p-5">
      <div class="flex items-center gap-2 py-3 text-xs text-muted-foreground">
        <Loader2 class="h-4 w-4 animate-spin text-primary" />
        <span>{{ loading ? 'Rastreando Google News Rosario y generando ideas con IA...' : 'Cargando ideas de Firestore...' }}</span>
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

    <!-- Empty State (cuando no hay ideas en la bandeja) -->
    <div
      v-else-if="!loading && !fetchingIdeas && ideas.length === 0"
      class="flex flex-col items-center justify-center gap-5 px-6 py-12 text-center"
    >
      <!-- Stepper horizontal sutil -->
      <div class="flex flex-wrap items-center justify-center gap-1.5 text-xs font-medium sm:gap-2">
        <div class="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-primary shadow-xs">
          <span class="flex h-4 w-4 items-center justify-center rounded-full bg-primary/20 text-[10px] font-semibold text-primary">1</span>
          <span>Escaneo</span>
        </div>
        <span class="font-normal text-muted-foreground/40">➔</span>
        <div class="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-muted/40 px-3 py-1 text-muted-foreground/70">
          <span class="flex h-4 w-4 items-center justify-center rounded-full bg-muted-foreground/20 text-[10px] font-semibold text-muted-foreground">2</span>
          <span>Supervisión</span>
        </div>
        <span class="font-normal text-muted-foreground/40">➔</span>
        <div class="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-muted/40 px-3 py-1 text-muted-foreground/70">
          <span class="flex h-4 w-4 items-center justify-center rounded-full bg-muted-foreground/20 text-[10px] font-semibold text-muted-foreground">3</span>
          <span>Redacción IA</span>
        </div>
      </div>

      <!-- Textos -->
      <div class="flex max-w-sm flex-col gap-1.5">
        <p class="text-sm font-semibold text-foreground">Radar despejado</p>
        <p class="text-xs leading-relaxed text-muted-foreground">
          Escaneá las últimas tendencias para descubrir nuevas oportunidades de contenido y convertirlas en publicaciones.
        </p>
      </div>

      <!-- CTA integrado en el empty state -->
      <button
        id="btn-trigger-scraper-empty"
        type="button"
        :disabled="loading"
        class="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
        @click="runScan"
      >
        <Sparkles class="h-3.5 w-3.5" />
        <span>Iniciar Escaneo con IA</span>
      </button>
    </div>

    <!-- Data State: List of Items (Multi-Estado) -->
    <div v-if="!loading && ideas.length > 0">
      <!-- Toolbar: collapse/expand all -->
      <div class="flex items-center justify-between border-b border-border/50 px-5 py-2">
        <span class="text-xs font-medium text-muted-foreground">
          {{ ideas.length }} {{ ideas.length === 1 ? 'idea activa' : 'ideas activas' }}
        </span>
        <button
          type="button"
          class="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          :title="anyExpanded ? 'Colapsar todas' : 'Expandir todas'"
          @click="toggleAll"
        >
          <span>Scrapy Agent Ideas - JL Masajistas</span>
          <component :is="anyExpanded ? ChevronsDownUp : ChevronsUpDown" class="h-3.5 w-3.5" />
        </button>
      </div>

      <ul class="flex flex-col divide-y divide-border">
        <li
          v-for="item in ideas"
          :key="item.id"
          :class="cn(
            'flex flex-col gap-0 transition-colors',
            item.status === 'approved'
              ? 'border-l-2 border-l-success bg-success/5 hover:bg-success/10'
              : 'hover:bg-muted/10'
          )"
        >
          <!-- Row header with toggle -->
          <button
            type="button"
            class="flex w-full items-start gap-3 px-5 py-3.5 text-left"
            :aria-expanded="isExpanded(item.id)"
            :aria-controls="`card-body-${item.id}`"
            @click="toggleExpand(item.id)"
          >
            <!-- Platforms + Status badge + Headline -->
            <div class="flex flex-1 flex-col gap-1">
              <div class="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                <span
                  v-for="platform in item.platforms"
                  :key="platform"
                  class="rounded bg-muted px-1.5 py-0.5 font-medium text-foreground"
                >
                  {{ platform }}
                </span>
                <span
                  v-if="formatNewsDate(item.publishedAt)"
                  class="rounded bg-muted px-1.5 py-0.5 font-medium text-foreground"
                >
                  {{ formatNewsDate(item.publishedAt) }}
                </span>
                <span aria-hidden="true">·</span>
                <span>{{ item.status === 'approved' ? 'Aprobada' : 'Pendiente' }}</span>

                <!-- Status badge when approved -->
                <span
                  v-if="item.status === 'approved'"
                  class="inline-flex items-center gap-1 rounded-md bg-success/15 px-2 py-0.5 text-[11px] font-semibold text-success"
                >
                  <Check class="h-3 w-3" />
                  Aprobada
                </span>
              </div>
              <p class="text-sm font-semibold leading-snug text-pretty text-foreground">
                {{ item.headline }}
              </p>
            </div>
            <!-- Chevron icon -->
            <svg
              :class="['mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/60 transition-transform duration-200', isExpanded(item.id) ? 'rotate-180' : 'rotate-0']"
              viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          <!-- Collapsible body -->
          <div
            :id="`card-body-${item.id}`"
            v-show="isExpanded(item.id)"
            class="flex flex-col gap-3 px-5 pb-4"
          >
            <!-- Source link -->
            <a
              v-if="item.sourceUrl && item.sourceUrl !== '#'"
              :href="item.sourceUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1 text-xs text-primary/80 transition-colors hover:text-primary hover:underline"
            >
              <span>Fuente Real</span>
              <ExternalLink class="h-3 w-3" />
            </a>

            <!-- Content Idea (Rendered Markdown) -->
            <div
              v-if="item.contentIdea"
              class="markdown-content rounded-lg border border-border/60 bg-muted/30 p-3.5 font-normal leading-relaxed text-xs text-foreground/80 shadow-sm [&>p]:mb-3 [&>p:last-child]:mb-0 [&>ul]:my-2.5 [&>ul]:list-disc [&>ul]:pl-4 [&>ul>li]:mb-1 [&>ol]:my-2.5 [&>ol]:list-decimal [&>ol]:pl-4 [&>ol>li]:mb-1 [&>h3]:mb-2 [&>h3]:mt-3 [&>h3:first-child]:mt-0 [&>h3]:font-semibold [&>h3]:text-foreground [&>h4]:mb-1.5 [&>h4]:mt-2 [&>h4]:font-semibold [&>strong]:font-semibold [&>strong]:text-foreground"
              v-html="parseMarkdown(item.contentIdea)"
            ></div>

            <!-- UI DINÁMICA POR ESTADO -->

            <!-- Estado: pending_review (Botones Aprobar y Descartar) -->
            <div v-if="item.status === 'pending_review'" class="flex items-center gap-2 pt-1">
              <button
                type="button"
                class="inline-flex items-center gap-1.5 rounded-lg bg-success px-3.5 py-1.5 text-xs font-medium text-success-foreground shadow-sm transition-all hover:bg-success/90 hover:shadow"
                @click.stop="handleApprove(item.id)"
              >
                <Check class="h-3.5 w-3.5" />
                Aprobar
              </button>
              <button
                type="button"
                class="inline-flex items-center gap-1.5 rounded-lg bg-destructive px-3.5 py-1.5 text-xs font-medium text-destructive-foreground shadow-sm transition-all hover:bg-destructive/90 hover:shadow"
                @click.stop="handleDiscard(item.id)"
              >
                <X class="h-3.5 w-3.5" />
                Descartar
              </button>
            </div>

            <!-- Estado: approved (Borde verde activo + Botón Tachito Archivar) -->
            <div v-else-if="item.status === 'approved'" class="flex items-center justify-between pt-1">
              <span class="inline-flex items-center gap-1.5 rounded-md bg-success/15 px-2.5 py-1 text-xs font-medium text-success">
                <Check class="h-3.5 w-3.5" /> Lista para redacción
              </span>
              <button
                type="button"
                title="Archivar idea"
                class="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-xs transition-all hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
                @click.stop="handleArchive(item.id)"
              >
                <Trash2 class="h-3.5 w-3.5" />
                <span>Archivar</span>
              </button>
            </div>
          </div>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
:deep(.markdown-content h3),
:deep(.markdown-content h4) {
  font-weight: 700;
  font-size: 0.8125rem;
  color: hsl(var(--foreground));
  margin-top: 0.625rem;
  margin-bottom: 0.375rem;
  letter-spacing: -0.01em;
}

:deep(.markdown-content h3:first-child),
:deep(.markdown-content h4:first-child) {
  margin-top: 0;
}

:deep(.markdown-content p) {
  margin-bottom: 0.5rem;
  line-height: 1.55;
}

:deep(.markdown-content p:last-child) {
  margin-bottom: 0;
}

:deep(.markdown-content strong) {
  font-weight: 600;
  color: hsl(var(--primary));
}

:deep(.markdown-content ul),
:deep(.markdown-content ol) {
  margin-left: 1.125rem;
  margin-bottom: 0.5rem;
  list-style-type: disc;
}

:deep(.markdown-content li) {
  margin-bottom: 0.25rem;
  line-height: 1.5;
}

:deep(.markdown-content blockquote) {
  border-left: 3px solid hsl(var(--primary) / 0.4);
  padding-left: 0.75rem;
  margin: 0.5rem 0;
  font-style: italic;
  color: hsl(var(--muted-foreground));
}
</style>
