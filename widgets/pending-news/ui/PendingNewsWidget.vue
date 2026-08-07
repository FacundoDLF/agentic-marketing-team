<script setup lang="ts">
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
  Link2,
} from '@lucide/vue'
import { useScraper, type ScraperTimeframe } from '~~/features/ScraperNews'
import { AGENTS, SECTIONS } from '~~/shared/constants'
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

const pendingIdeas = computed(() =>
  ideas.value.filter(
    (item) => item.status === 'pending' || item.status === 'pending_review' || !item.status,
  ),
)

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

const anyExpanded = computed(() => pendingIdeas.value.some((item) => isExpanded(item.id)))

function toggleAll(): void {
  const target = !anyExpanded.value
  const next: Record<string, boolean> = {}
  pendingIdeas.value.forEach((item) => {
    next[item.id] = target
  })
  expandedItems.value = next
}

function isExpanded(id: string): boolean {
  return expandedItems.value[id] !== false
}

function toggleExpand(id: string): void {
  expandedItems.value[id] = !isExpanded(id)
}

function handleApprove(id: string): void {
  updateIdeaStatus(id, 'approved')
}

function handleDiscard(id: string): void {
  updateIdeaStatus(id, 'rejected')
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
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ]
  const month = months[d.getMonth()]
  const year = d.getFullYear()

  return `${day} de ${month} ${year}`
}
</script>

<template>
  <section class="flex flex-col rounded-xl border border-border bg-card shadow-sm transition-all">
    <header class="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
      <div class="flex min-w-0 flex-1 items-center gap-3">
        <div
          class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground shadow-xs"
        >
          <SatelliteDishIcon class="h-4 w-4 text-primary" />
        </div>
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <h2 class="text-sm font-semibold tracking-tight text-foreground sm:text-base">
              {{ SECTIONS.TENDENCIAS.title }}
            </h2>
          </div>
          <p class="text-xs leading-snug text-muted-foreground sm:text-sm">
            Rastreo inteligente de noticias con {{ AGENTS.SCRAPY.name }}. Aprobá tendencias para redactar copys en Newsroom.
          </p>
        </div>
      </div>

      <div class="flex shrink-0 items-center gap-2">
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
        </div>

        <button
          id="btn-trigger-scraper"
          type="button"
          :disabled="loading"
          class="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow disabled:cursor-not-allowed disabled:opacity-60"
          @click="runScan"
        >
          <RefreshCw :class="['h-3.5 w-3.5', loading ? 'animate-spin' : '']" />
          <span>{{ loading ? 'Escaneando...' : 'Escanear Noticias' }}</span>
        </button>
      </div>
    </header>

    <div class="flex items-center gap-2 border-b border-border/60 bg-muted/20 px-5 py-2.5">
      <div class="relative flex-1">
        <Link2
          class="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
        />
        <input
          v-model="manualUrl"
          type="url"
          placeholder="Ingresá acá el link directo de una noticia para procesarla manualmente con Scrapy Agent."
          :disabled="loading || fetchingIdeas"
          class="h-8 w-full rounded-lg border border-border bg-background pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground/60 transition-colors focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50"
          @keydown.enter.prevent="handleManualSubmit"
        />
      </div>
      <button
        type="button"
        :disabled="loading || fetchingIdeas || !manualUrl.trim()"
        class="inline-flex h-8 items-center gap-1.5 rounded-lg bg-secondary px-3 text-xs font-medium text-secondary-foreground shadow-xs transition-all hover:bg-secondary/80 disabled:cursor-not-allowed disabled:opacity-40"
        @click="handleManualSubmit"
      >
        <Sparkles class="h-3.5 w-3.5 text-primary" />
        <span>Procesar Link</span>
      </button>
    </div>

    <div
      v-if="error"
      class="mx-5 mt-4 flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive"
      role="alert"
    >
      <AlertCircle class="h-4 w-4 shrink-0" />
      <span class="flex-1">{{ error }}</span>
    </div>

    <div
      v-if="toastBandejaLlena"
      class="mx-5 mt-4 flex items-start gap-2.5 rounded-lg border border-chart-4/30 bg-chart-4/10 p-3 text-xs text-foreground/90"
      role="status"
    >
      <AlertTriangle class="mt-0.5 h-4 w-4 shrink-0 text-chart-4" />
      <p class="flex-1">
        <span class="font-semibold text-chart-4">Bandeja llena.</span> Tenés 10 ideas pendientes de
        revisión. Aprobá o descartá algunas para liberar espacio antes de volver a escanear.
      </p>
    </div>

    <div
      v-if="toastUrlDuplicada"
      class="mx-5 mt-4 flex items-start gap-2.5 rounded-lg border border-chart-4/30 bg-chart-4/10 p-3 text-xs text-foreground/90"
      role="status"
    >
      <Info class="mt-0.5 h-4 w-4 shrink-0 text-chart-4" />
      <p class="flex-1">
        <span class="font-semibold text-chart-4">URL ya procesada.</span> Esta noticia ya fue
        analizada anteriormente. Ingresá un link nuevo.
      </p>
    </div>

    <div
      v-if="toastRssAgotado && !loading"
      class="mx-5 mt-4 flex items-start gap-2.5 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-foreground/80"
      role="status"
    >
      <Info class="mt-0.5 h-4 w-4 shrink-0 text-primary/70" />
      <p class="flex-1">
        <span class="font-semibold">Ya estás al día.</span> No hay noticias nuevas en este período.
        Intentá con otro filtro o volvé más tarde.
      </p>
    </div>

    <div
      v-if="loading || (fetchingIdeas && pendingIdeas.length === 0)"
      class="flex flex-col divide-y divide-border p-5"
    >
      <div class="flex items-center gap-2 py-3 text-xs text-muted-foreground">
        <Loader2 class="h-4 w-4 animate-spin text-primary" />
        <span>{{
          loading
            ? 'Rastreando noticias y extrayendo ideas con IA...'
            : 'Cargando ideas de Firestore...'
        }}</span>
      </div>
      <div v-for="i in 3" :key="i" class="flex flex-col gap-2.5 py-4 animate-pulse">
        <div class="flex items-center gap-2">
          <div class="h-4 w-20 rounded bg-muted"></div>
          <div class="h-4 w-16 rounded bg-muted"></div>
        </div>
        <div class="h-4 w-full rounded bg-muted"></div>
        <div class="h-3 w-3/4 rounded bg-muted/70"></div>
      </div>
    </div>

    <div
      v-else-if="!loading && !fetchingIdeas && pendingIdeas.length === 0"
      class="flex flex-col items-center justify-center gap-5 px-6 py-12 text-center"
    >
      <div class="flex flex-wrap items-center justify-center gap-1.5 text-xs font-medium sm:gap-2">
        <div
          class="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-primary shadow-xs"
        >
          <span
            class="flex h-4 w-4 items-center justify-center rounded-full bg-primary/20 text-[10px] font-semibold text-primary"
            >1</span
          >
          <span>Descubrimiento ({{ AGENTS.SCRAPY.name }})</span>
        </div>
        <span class="font-normal text-muted-foreground/40">➔</span>
        <div
          class="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-muted/40 px-3 py-1 text-muted-foreground/70"
        >
          <span
            class="flex h-4 w-4 items-center justify-center rounded-full bg-muted-foreground/20 text-[10px] font-semibold text-muted-foreground"
            >2</span
          >
          <span>Aprobación</span>
        </div>
        <span class="font-normal text-muted-foreground/40">➔</span>
        <div
          class="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-muted/40 px-3 py-1 text-muted-foreground/70"
        >
          <span
            class="flex h-4 w-4 items-center justify-center rounded-full bg-muted-foreground/20 text-[10px] font-semibold text-muted-foreground"
            >3</span
          >
          <span>Newsroom ({{ AGENTS.COPPY_HOOK.name }})</span>
        </div>
      </div>

      <div class="flex max-w-sm flex-col gap-1.5">
        <p class="text-sm font-semibold text-foreground">Radar despejado</p>
        <p class="text-xs leading-relaxed text-muted-foreground">
          No hay ideas pendientes de revisión. Escaneá las últimas tendencias o ingresá un link para descubrir nuevas oportunidades.
        </p>
      </div>

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

    <div v-if="!loading && pendingIdeas.length > 0">
      <div class="flex items-center justify-between border-b border-border/50 px-5 py-2">
        <span class="text-xs font-medium text-muted-foreground">
          {{ pendingIdeas.length }} {{ pendingIdeas.length === 1 ? 'idea pendiente' : 'ideas pendientes' }}
        </span>
        <button
          type="button"
          class="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          :title="anyExpanded ? 'Colapsar todas' : 'Expandir todas'"
          @click="toggleAll"
        >
          <span>Ideas {{ AGENTS.SCRAPY.name }}</span>
          <component :is="anyExpanded ? ChevronsDownUp : ChevronsUpDown" class="h-3.5 w-3.5" />
        </button>
      </div>

      <ul class="flex flex-col divide-y divide-border">
        <li
          v-for="item in pendingIdeas"
          :key="item.id"
          class="flex flex-col gap-0 transition-colors hover:bg-muted/10"
        >
          <button
            type="button"
            class="flex w-full items-start gap-3 px-5 py-3.5 text-left"
            :aria-expanded="isExpanded(item.id)"
            :aria-controls="`card-body-${item.id}`"
            @click="toggleExpand(item.id)"
          >
            <div class="flex flex-1 flex-col gap-1.5">
              <div class="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                <span
                  v-for="platform in item.platforms"
                  :key="platform"
                  class="rounded bg-muted px-1.5 py-0.5 font-medium text-foreground text-[11px]"
                >
                  {{ platform }}
                </span>
                <span
                  v-if="formatNewsDate(item.publishedAt)"
                  class="rounded bg-muted px-1.5 py-0.5 font-medium text-foreground text-[11px]"
                >
                  {{ formatNewsDate(item.publishedAt) }}
                </span>
                <span aria-hidden="true">·</span>
                <span class="text-[11px] text-muted-foreground">
                  Pendiente de revisión
                </span>
              </div>
              <p class="text-sm font-semibold leading-snug text-pretty text-foreground">
                {{ item.headline }}
              </p>
            </div>
            <svg
              :class="[
                'mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/60 transition-transform duration-200',
                isExpanded(item.id) ? 'rotate-180' : 'rotate-0',
              ]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          <div
            :id="`card-body-${item.id}`"
            v-show="isExpanded(item.id)"
            class="flex flex-col gap-3.5 px-5 pb-4.5"
          >
            <a
              v-if="item.sourceUrl && item.sourceUrl !== '#'"
              :href="item.sourceUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1 text-xs text-primary/80 transition-colors hover:text-primary hover:underline"
            >
              <span>Fuente Real de la Noticia</span>
              <ExternalLink class="h-3 w-3" />
            </a>

            <div class="flex flex-col gap-1.5">
              <span
                class="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Idea Estratégica ({{ AGENTS.SCRAPY.name }})
              </span>
              <div
                v-if="item.contentIdea"
                class="markdown-content rounded-lg border border-border/60 bg-muted/30 p-3.5 font-normal leading-relaxed text-xs text-foreground/85 shadow-xs [&>p]:mb-2.5 [&>p:last-child]:mb-0 [&>ul]:my-2 [&>ul]:list-disc [&>ul]:pl-4 [&>ul>li]:mb-1 [&>ol]:my-2 [&>ol]:list-decimal [&>ol]:pl-4 [&>ol>li]:mb-1 [&>h3]:mb-1.5 [&>h3]:mt-2.5 [&>h3:first-child]:mt-0 [&>h3]:font-semibold [&>h3]:text-foreground [&>strong]:font-semibold [&>strong]:text-foreground"
                v-html="parseMarkdown(item.contentIdea)"
              ></div>
            </div>

            <div class="flex items-center gap-2 pt-1">
              <button
                type="button"
                class="inline-flex items-center gap-1.5 rounded-lg bg-success px-3.5 py-1.5 text-xs font-medium text-success-foreground shadow-xs transition-all hover:bg-success/90 hover:shadow"
                @click.stop="handleApprove(item.id)"
              >
                <Check class="h-3.5 w-3.5" />
                Aprobar Idea
              </button>
              <button
                type="button"
                class="inline-flex items-center gap-1.5 rounded-lg bg-destructive px-3.5 py-1.5 text-xs font-medium text-destructive-foreground shadow-xs transition-all hover:bg-destructive/90 hover:shadow"
                @click.stop="handleDiscard(item.id)"
              >
                <X class="h-3.5 w-3.5" />
                Descartar
              </button>
            </div>
          </div>
        </li>
      </ul>
    </div>
  </section>
</template>
