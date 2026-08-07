<script setup lang="ts">
/**
 * PendingNewsWidget: Radar de Tendencias and Coppy-Hook Agent UI.
 * Layer: widgets/pending-news
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
  Copy,
  CheckCheck,
  Wand2,
  Layers,
  MessageSquare,
  Hash,
  Target,
  Video,
} from '@lucide/vue'
import { useScraper, type ScraperTimeframe } from '~~/features/ScraperNews'
import { agentService } from '~~/services/agentService'
import { AGENTS, SECTIONS } from '~~/shared/constants'
import { cn } from '~~/shared/lib/utils'
import type { NewsIdea } from '~~/entities/news/types'

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

// Coppy-Hook Agent UI State
const selectedPlatforms = ref<Record<string, string>>({})
const generatingCopy = ref<Record<string, boolean>>({})
const copiedKeys = ref<Record<string, boolean>>({})
const copyError = ref<Record<string, string>>({})

const platformOptions = [
  'Instagram Reel',
  'Instagram Carousel',
  'TikTok',
  'WhatsApp / Historia',
  'YouTube Short',
]

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
const anyExpanded = computed(() => ideas.value.some((item) => isExpanded(item.id)))

function toggleAll(): void {
  const target = !anyExpanded.value
  const next: Record<string, boolean> = {}
  ideas.value.forEach((item) => {
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
  expandedItems.value[id] = true
}

function handleDiscard(id: string): void {
  updateIdeaStatus(id, 'rejected')
}

function handleArchive(id: string): void {
  updateIdeaStatus(id, 'archived')
}

function getSelectedPlatform(item: NewsIdea): string {
  const chosen = selectedPlatforms.value[item.id]
  if (chosen) {
    return chosen
  }
  if (item.copyPlatform) {
    return item.copyPlatform
  }
  const first = item.platforms?.[0]
  if (first) {
    return first
  }
  return 'Instagram Reel'
}

function setSelectedPlatform(id: string, platform: string): void {
  selectedPlatforms.value[id] = platform
}

async function handleGenerateCopy(item: NewsIdea): Promise<void> {
  const platform = getSelectedPlatform(item)
  generatingCopy.value[item.id] = true
  copyError.value[item.id] = ''
  expandedItems.value[item.id] = true

  try {
    const res = await agentService.generateCopy(item.id, platform, {
      headline: item.headline,
      contentIdea: item.contentIdea,
      sourceUrl: item.sourceUrl,
    })

    if (res.success && res.data) {
      item.status = 'copy_ready'
      item.copyFormatted = res.data.formattedCopy
      item.copySections = res.data.sections
      item.copyPlatform = res.data.platform
    }
  } catch (err: any) {
    console.error(`Error generando copy con ${AGENTS.COPPY_HOOK.name}:`, err)
    copyError.value[item.id] =
      err?.data?.message ||
      err?.message ||
      `Error al generar copy con ${AGENTS.COPPY_HOOK.name}. Por favor reintentá.`
  } finally {
    generatingCopy.value[item.id] = false
  }
}

async function copyToClipboard(text: string, key: string): Promise<void> {
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    copiedKeys.value[key] = true
    setTimeout(() => {
      copiedKeys.value[key] = false
    }, 2000)
  } catch (e) {
    console.warn('Error al copiar al portapapeles:', e)
  }
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
    <!-- Header -->
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
            Ideas estratégicas de noticias reales. Aprobá y generá copys de alto impacto con un
            clic.
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

    <!-- Manual URL Ingestion Bar -->
    <div class="flex items-center gap-2 border-b border-border/60 bg-muted/20 px-5 py-2.5">
      <div class="relative flex-1">
        <Link2
          class="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
        />
        <input
          v-model="manualUrl"
          type="url"
          placeholder="Ingresá acá el link directo de una noticia para procesarla manualmente."
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

    <!-- Error Banner -->
    <div
      v-if="error"
      class="mx-5 mt-4 flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive"
      role="alert"
    >
      <AlertCircle class="h-4 w-4 shrink-0" />
      <span class="flex-1">{{ error }}</span>
    </div>

    <!-- Toast: Bandeja Llena -->
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

    <!-- Toast: URL Duplicada -->
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

    <!-- Toast: RSS Agotado (Ya estás al día) -->
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

    <!-- Loading Skeleton State -->
    <div
      v-if="loading || (fetchingIdeas && ideas.length === 0)"
      class="flex flex-col divide-y divide-border p-5"
    >
      <div class="flex items-center gap-2 py-3 text-xs text-muted-foreground">
        <Loader2 class="h-4 w-4 animate-spin text-primary" />
        <span>{{
          loading
            ? 'Rastreando Google News Rosario y procesando con IA...'
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
      <!-- Stepper horizontal -->
      <div class="flex flex-wrap items-center justify-center gap-1.5 text-xs font-medium sm:gap-2">
        <div
          class="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-primary shadow-xs"
        >
          <span
            class="flex h-4 w-4 items-center justify-center rounded-full bg-primary/20 text-[10px] font-semibold text-primary"
            >1</span
          >
          <span>Escaneo ({{ AGENTS.SCRAPY.name }})</span>
        </div>
        <span class="font-normal text-muted-foreground/40">➔</span>
        <div
          class="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-muted/40 px-3 py-1 text-muted-foreground/70"
        >
          <span
            class="flex h-4 w-4 items-center justify-center rounded-full bg-muted-foreground/20 text-[10px] font-semibold text-muted-foreground"
            >2</span
          >
          <span>Supervisión</span>
        </div>
        <span class="font-normal text-muted-foreground/40">➔</span>
        <div
          class="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-muted/40 px-3 py-1 text-muted-foreground/70"
        >
          <span
            class="flex h-4 w-4 items-center justify-center rounded-full bg-muted-foreground/20 text-[10px] font-semibold text-muted-foreground"
            >3</span
          >
          <span>{{ AGENTS.COPPY_HOOK.name }}</span>
        </div>
      </div>

      <!-- Textos -->
      <div class="flex max-w-sm flex-col gap-1.5">
        <p class="text-sm font-semibold text-foreground">Radar despejado</p>
        <p class="text-xs leading-relaxed text-muted-foreground">
          Escaneá las últimas tendencias para descubrir nuevas oportunidades de contenido y
          convertirlas en publicaciones.
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
          <span>Ideas {{ AGENTS.SCRAPY.name }}</span>
          <component :is="anyExpanded ? ChevronsDownUp : ChevronsUpDown" class="h-3.5 w-3.5" />
        </button>
      </div>

      <ul class="flex flex-col divide-y divide-border">
        <li
          v-for="item in ideas"
          :key="item.id"
          :class="
            cn(
              'flex flex-col gap-0 transition-colors',
              item.status === 'copy_ready'
                ? 'border-l-3 border-l-primary bg-primary/5 hover:bg-primary/8'
                : item.status === 'approved'
                  ? 'border-l-3 border-l-success bg-success/5 hover:bg-success/10'
                  : 'hover:bg-muted/10',
            )
          "
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

                <!-- Status badge: copy_ready -->
                <span
                  v-if="item.status === 'copy_ready'"
                  class="inline-flex items-center gap-1 rounded-md bg-primary/15 px-2 py-0.5 text-[11px] font-semibold text-primary"
                >
                  <Wand2 class="h-3 w-3" />
                  Copy Listo
                </span>

                <!-- Status badge: approved -->
                <span
                  v-else-if="item.status === 'approved'"
                  class="inline-flex items-center gap-1 rounded-md bg-success/15 px-2 py-0.5 text-[11px] font-semibold text-success"
                >
                  <Check class="h-3 w-3" />
                  Aprobada
                </span>

                <!-- Status badge: pending -->
                <span v-else class="text-[11px] text-muted-foreground">
                  Pendiente de revisión
                </span>
              </div>
              <p class="text-sm font-semibold leading-snug text-pretty text-foreground">
                {{ item.headline }}
              </p>
            </div>
            <!-- Chevron icon -->
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

          <!-- Collapsible body -->
          <div
            :id="`card-body-${item.id}`"
            v-show="isExpanded(item.id)"
            class="flex flex-col gap-3.5 px-5 pb-4.5"
          >
            <!-- Source link -->
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

            <!-- Content Idea (Rendered Markdown de Idea Cruda) -->
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

            <!-- UI DINÁMICA POR ESTADO -->

            <!-- Estado: pending_review (Botones Aprobar y Descartar) -->
            <div
              v-if="item.status === 'pending_review' || item.status === 'pending'"
              class="flex items-center gap-2 pt-1"
            >
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

            <!-- Estado: approved o copy_ready (Sección Coppy-Hook Agent) -->
            <div
              v-else-if="
                item.status === 'approved' ||
                item.status === 'copy_ready' ||
                item.status === 'copy_generating'
              "
              class="flex flex-col gap-3 rounded-xl border border-border/80 bg-background/70 p-4 shadow-xs"
            >
              <!-- Control Bar: Platform Selector + Generate Button + Archive -->
              <div
                class="flex flex-wrap items-center justify-between gap-2.5 border-b border-border/60 pb-3"
              >
                <div class="flex flex-wrap items-center gap-2">
                  <label
                    :for="`platform-${item.id}`"
                    class="text-xs font-medium text-muted-foreground"
                  >
                    Plataforma:
                  </label>
                  <select
                    :id="`platform-${item.id}`"
                    :value="getSelectedPlatform(item)"
                    :disabled="generatingCopy[item.id]"
                    class="h-7 rounded-md border border-border bg-muted/50 px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-muted focus:outline-none focus:ring-1 focus:ring-primary/40 disabled:opacity-50"
                    @change="
                      setSelectedPlatform(item.id, ($event.target as HTMLSelectElement).value)
                    "
                  >
                    <option v-for="p in platformOptions" :key="p" :value="p">
                      {{ p }}
                    </option>
                  </select>
                </div>

                <div class="flex items-center gap-2">
                  <!-- Botón Generar Copy con Coppy-Hook -->
                  <button
                    type="button"
                    :disabled="generatingCopy[item.id]"
                    class="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-xs transition-all hover:bg-primary/90 hover:shadow disabled:cursor-not-allowed disabled:opacity-60"
                    @click.stop="handleGenerateCopy(item)"
                  >
                    <Loader2 v-if="generatingCopy[item.id]" class="h-3.5 w-3.5 animate-spin" />
                    <Wand2 v-else class="h-3.5 w-3.5 text-primary-foreground" />
                    <span>
                      {{
                        generatingCopy[item.id]
                          ? `Redactando Copy (${AGENTS.COPPY_HOOK.name})...`
                          : item.copyFormatted
                            ? 'Regenerar Copy'
                            : `Generar Copy con ${AGENTS.COPPY_HOOK.name}`
                      }}
                    </span>
                  </button>

                  <!-- Botón Archivar -->
                  <button
                    type="button"
                    title="Archivar idea"
                    class="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
                    @click.stop="handleArchive(item.id)"
                  >
                    <Trash2 class="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <!-- Error al generar copy -->
              <div
                v-if="copyError[item.id]"
                class="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-2.5 text-xs text-destructive"
              >
                <AlertCircle class="h-4 w-4 shrink-0" />
                <span class="flex-1">{{ copyError[item.id] }}</span>
              </div>

              <!-- Copy Generation Loading Spinner -->
              <div
                v-if="generatingCopy[item.id]"
                class="flex items-center justify-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-6 text-xs text-primary"
              >
                <Loader2 class="h-5 w-5 animate-spin" />
                <div class="flex flex-col gap-0.5">
                  <span class="font-semibold"
                    >{{ AGENTS.COPPY_HOOK.name }} está creando el guión...</span
                  >
                  <span class="text-[11px] text-muted-foreground"
                    >Aplicando estructura de gancho magnético, caption y hashtags para
                    Rosario.</span
                  >
                </div>
              </div>

              <!-- RENDERIZADO ESTRUCTURADO DEL COPY (SECCIONES CON ONE-CLICK COPY) -->
              <div v-else-if="item.copySections" class="flex flex-col gap-2.5 pt-1">
                <!-- 1. ⚓ Hook (3s) -->
                <div
                  class="group relative rounded-lg border border-border/70 bg-card p-3 shadow-2xs transition-all hover:border-primary/40"
                >
                  <div class="mb-1.5 flex items-center justify-between">
                    <span
                      class="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground"
                    >
                      <span>⚓ Hook (3s)</span>
                      <span class="text-[10px] font-normal text-muted-foreground"
                        >Freno de scroll</span
                      >
                    </span>
                    <button
                      type="button"
                      class="inline-flex items-center gap-1 rounded-md border border-border/60 bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-foreground transition-all hover:bg-muted active:scale-95"
                      @click="copyToClipboard(item.copySections.hook, `hook-${item.id}`)"
                    >
                      <CheckCheck
                        v-if="copiedKeys[`hook-${item.id}`]"
                        class="h-3 w-3 text-success"
                      />
                      <Copy v-else class="h-3 w-3 text-muted-foreground" />
                      <span
                        :class="copiedKeys[`hook-${item.id}`] ? 'text-success font-semibold' : ''"
                      >
                        {{ copiedKeys[`hook-${item.id}`] ? '¡Copiado!' : 'Copiar' }}
                      </span>
                    </button>
                  </div>
                  <p class="text-xs leading-relaxed text-foreground/90 font-medium">
                    {{ item.copySections.hook }}
                  </p>
                </div>

                <!-- 2. 📝 Cuerpo / Guión -->
                <div
                  class="group relative rounded-lg border border-border/70 bg-card p-3 shadow-2xs transition-all hover:border-primary/40"
                >
                  <div class="mb-1.5 flex items-center justify-between">
                    <span
                      class="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground"
                    >
                      <span>📝 Cuerpo / Guión</span>
                      <span class="text-[10px] font-normal text-muted-foreground"
                        >Contenido principal</span
                      >
                    </span>
                    <button
                      type="button"
                      class="inline-flex items-center gap-1 rounded-md border border-border/60 bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-foreground transition-all hover:bg-muted active:scale-95"
                      @click="copyToClipboard(item.copySections.body, `body-${item.id}`)"
                    >
                      <CheckCheck
                        v-if="copiedKeys[`body-${item.id}`]"
                        class="h-3 w-3 text-success"
                      />
                      <Copy v-else class="h-3 w-3 text-muted-foreground" />
                      <span
                        :class="copiedKeys[`body-${item.id}`] ? 'text-success font-semibold' : ''"
                      >
                        {{ copiedKeys[`body-${item.id}`] ? '¡Copiado!' : 'Copiar' }}
                      </span>
                    </button>
                  </div>
                  <p class="whitespace-pre-line text-xs leading-relaxed text-foreground/90">
                    {{ item.copySections.body }}
                  </p>
                </div>

                <!-- 3. 💬 Caption -->
                <div
                  class="group relative rounded-lg border border-border/70 bg-card p-3 shadow-2xs transition-all hover:border-primary/40"
                >
                  <div class="mb-1.5 flex items-center justify-between">
                    <span
                      class="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground"
                    >
                      <span>💬 Caption</span>
                      <span class="text-[10px] font-normal text-muted-foreground"
                        >Descripción del post</span
                      >
                    </span>
                    <button
                      type="button"
                      class="inline-flex items-center gap-1 rounded-md border border-border/60 bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-foreground transition-all hover:bg-muted active:scale-95"
                      @click="copyToClipboard(item.copySections.caption, `caption-${item.id}`)"
                    >
                      <CheckCheck
                        v-if="copiedKeys[`caption-${item.id}`]"
                        class="h-3 w-3 text-success"
                      />
                      <Copy v-else class="h-3 w-3 text-muted-foreground" />
                      <span
                        :class="
                          copiedKeys[`caption-${item.id}`] ? 'text-success font-semibold' : ''
                        "
                      >
                        {{ copiedKeys[`caption-${item.id}`] ? '¡Copiado!' : 'Copiar' }}
                      </span>
                    </button>
                  </div>
                  <p class="whitespace-pre-line text-xs leading-relaxed text-foreground/85">
                    {{ item.copySections.caption }}
                  </p>
                </div>

                <!-- 4. #️⃣ Hashtags -->
                <div
                  class="group relative rounded-lg border border-border/70 bg-card p-3 shadow-2xs transition-all hover:border-primary/40"
                >
                  <div class="mb-1.5 flex items-center justify-between">
                    <span
                      class="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground"
                    >
                      <span>#️⃣ Hashtags</span>
                      <span class="text-[10px] font-normal text-muted-foreground"
                        >Tags optimizados</span
                      >
                    </span>
                    <button
                      type="button"
                      class="inline-flex items-center gap-1 rounded-md border border-border/60 bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-foreground transition-all hover:bg-muted active:scale-95"
                      @click="
                        copyToClipboard(item.copySections.hashtags.join(' '), `hashtags-${item.id}`)
                      "
                    >
                      <CheckCheck
                        v-if="copiedKeys[`hashtags-${item.id}`]"
                        class="h-3 w-3 text-success"
                      />
                      <Copy v-else class="h-3 w-3 text-muted-foreground" />
                      <span
                        :class="
                          copiedKeys[`hashtags-${item.id}`] ? 'text-success font-semibold' : ''
                        "
                      >
                        {{ copiedKeys[`hashtags-${item.id}`] ? '¡Copiado!' : 'Copiar' }}
                      </span>
                    </button>
                  </div>
                  <div class="flex flex-wrap gap-1.5">
                    <span
                      v-for="tag in item.copySections.hashtags"
                      :key="tag"
                      class="rounded-md bg-muted/60 px-1.5 py-0.5 text-[11px] font-medium text-primary"
                    >
                      {{ tag.startsWith('#') ? tag : `#${tag}` }}
                    </span>
                  </div>
                </div>

                <!-- 5. 🎯 CTA -->
                <div
                  class="group relative rounded-lg border border-border/70 bg-card p-3 shadow-2xs transition-all hover:border-primary/40"
                >
                  <div class="mb-1.5 flex items-center justify-between">
                    <span
                      class="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground"
                    >
                      <span>🎯 CTA</span>
                      <span class="text-[10px] font-normal text-muted-foreground"
                        >Llamado a la acción</span
                      >
                    </span>
                    <button
                      type="button"
                      class="inline-flex items-center gap-1 rounded-md border border-border/60 bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-foreground transition-all hover:bg-muted active:scale-95"
                      @click="copyToClipboard(item.copySections.cta, `cta-${item.id}`)"
                    >
                      <CheckCheck
                        v-if="copiedKeys[`cta-${item.id}`]"
                        class="h-3 w-3 text-success"
                      />
                      <Copy v-else class="h-3 w-3 text-muted-foreground" />
                      <span
                        :class="copiedKeys[`cta-${item.id}`] ? 'text-success font-semibold' : ''"
                      >
                        {{ copiedKeys[`cta-${item.id}`] ? '¡Copiado!' : 'Copiar' }}
                      </span>
                    </button>
                  </div>
                  <p class="text-xs leading-relaxed text-foreground/90 font-medium">
                    {{ item.copySections.cta }}
                  </p>
                </div>

                <!-- Botón: Copiar Todo el Copy Completo -->
                <div class="flex items-center justify-end pt-1">
                  <button
                    type="button"
                    class="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3.5 py-1.5 text-xs font-medium text-primary shadow-2xs transition-all hover:bg-primary/20 active:scale-98"
                    @click="copyToClipboard(item.copyFormatted || '', `all-${item.id}`)"
                  >
                    <CheckCheck
                      v-if="copiedKeys[`all-${item.id}`]"
                      class="h-3.5 w-3.5 text-success"
                    />
                    <Copy v-else class="h-3.5 w-3.5" />
                    <span :class="copiedKeys[`all-${item.id}`] ? 'text-success font-semibold' : ''">
                      {{
                        copiedKeys[`all-${item.id}`]
                          ? '¡Todo el Copy Copiado!'
                          : 'Copiar Copy Completo'
                      }}
                    </span>
                  </button>
                </div>
              </div>

              <!-- Fallback si tiene copyFormatted pero no copySections -->
              <div v-else-if="item.copyFormatted" class="flex flex-col gap-2 pt-1">
                <div
                  class="markdown-content rounded-lg border border-border/60 bg-card p-3 text-xs leading-relaxed text-foreground/90"
                  v-html="parseMarkdown(item.copyFormatted)"
                ></div>
                <div class="flex justify-end">
                  <button
                    type="button"
                    class="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20"
                    @click="copyToClipboard(item.copyFormatted, `all-${item.id}`)"
                  >
                    <CheckCheck
                      v-if="copiedKeys[`all-${item.id}`]"
                      class="h-3.5 w-3.5 text-success"
                    />
                    <Copy v-else class="h-3.5 w-3.5" />
                    <span>{{ copiedKeys[`all-${item.id}`] ? '¡Copiado!' : 'Copiar Todo' }}</span>
                  </button>
                </div>
              </div>

              <!-- Mensaje inicial de aprobado sin copy generado aún -->
              <div
                v-else
                class="flex items-center justify-between rounded-lg border border-dashed border-border/70 bg-muted/20 p-3 text-xs text-muted-foreground"
              >
                <span class="inline-flex items-center gap-1.5">
                  <Check class="h-3.5 w-3.5 text-success" />
                  Idea aprobada. Seleccioná la plataforma y clickeá en "Generar Copy".
                </span>
              </div>
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
