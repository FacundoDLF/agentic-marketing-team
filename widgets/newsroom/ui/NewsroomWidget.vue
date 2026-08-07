<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { marked } from 'marked'
import {
  FileText,
  Sparkles,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  Loader2,
  ChevronsDownUp,
  ChevronsUpDown,
  Trash2,
  Copy,
  CheckCheck,
  Wand2,
  Layers,
  ArrowRight,
} from '@lucide/vue'
import { useScraper } from '~~/features/ScraperNews'
import { agentService } from '~~/services/agentService'
import { AGENTS, SECTIONS } from '~~/shared/constants'
import { cn } from '~~/shared/lib/utils'
import type { NewsIdea } from '~~/entities/news/types'

const {
  fetchingIdeas,
  ideas,
  fetchIdeas,
  updateIdeaStatus,
  updateIdeaCopy,
} = useScraper()

const expandedItems = ref<Record<string, boolean>>({})
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

const approvedIdeas = computed(() =>
  ideas.value.filter(
    (item) =>
      item.status === 'approved' ||
      item.status === 'copy_ready' ||
      item.status === 'copy_generating',
  ),
)

const anyExpanded = computed(() => approvedIdeas.value.some((item) => isExpanded(item.id)))

function toggleAll(): void {
  const target = !anyExpanded.value
  const next: Record<string, boolean> = {}
  approvedIdeas.value.forEach((item) => {
    next[item.id] = target
  })
  expandedItems.value = next
}

function isExpanded(id: string): boolean {
  return expandedItems.value[id] === true
}

function toggleExpand(id: string): void {
  expandedItems.value[id] = !isExpanded(id)
}

function handleArchive(id: string): void {
  updateIdeaStatus(id, 'archived')
}

function getSelectedPlatform(item: NewsIdea): string {
  const chosen = selectedPlatforms.value[item.id]
  if (chosen) return chosen
  if (item.copyPlatform) return item.copyPlatform
  const first = item.platforms?.[0]
  if (first) return first
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
      updateIdeaCopy(item.id, {
        copyFormatted: res.data.formattedCopy,
        copySections: res.data.sections,
        copyPlatform: res.data.platform,
        status: 'copy_ready',
      })
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
    <header class="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
      <div class="flex min-w-0 flex-1 items-center gap-3">
        <div
          class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground shadow-xs"
        >
          <FileText class="h-4 w-4 text-primary" />
        </div>
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <h2 class="text-sm font-semibold tracking-tight text-foreground sm:text-base">
              {{ SECTIONS.BORRADORES.label }}
            </h2>
          </div>
          <p class="text-xs leading-snug text-muted-foreground sm:text-sm">
            Ideas aprobadas para redacción y adaptación multiplataforma con {{ AGENTS.COPPY_HOOK.name }}.
          </p>
        </div>
      </div>

      <div class="flex shrink-0 items-center gap-2">
        <button
          type="button"
          :disabled="fetchingIdeas"
          class="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs font-medium text-foreground transition-all hover:bg-muted disabled:opacity-50"
          @click="fetchIdeas"
        >
          <RefreshCw :class="['h-3.5 w-3.5', fetchingIdeas ? 'animate-spin' : '']" />
          <span>Actualizar</span>
        </button>
      </div>
    </header>

    <ClientOnly>
      <div v-if="fetchingIdeas && approvedIdeas.length === 0" class="flex flex-col divide-y divide-border p-5">
        <div class="flex items-center gap-2 py-3 text-xs text-muted-foreground">
          <Loader2 class="h-4 w-4 animate-spin text-primary" />
          <span>Cargando ideas aprobadas...</span>
        </div>
        <div v-for="i in 2" :key="i" class="flex flex-col gap-2.5 py-4 animate-pulse">
          <div class="flex items-center gap-2">
            <div class="h-4 w-24 rounded bg-muted"></div>
            <div class="h-4 w-16 rounded bg-muted"></div>
          </div>
          <div class="h-4 w-full rounded bg-muted"></div>
        </div>
      </div>

      <div
        v-else-if="!fetchingIdeas && approvedIdeas.length === 0"
        class="flex flex-col items-center justify-center gap-5 px-6 py-12 text-center"
      >
        <div
          class="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-accent-foreground shadow-xs"
        >
          <Sparkles class="h-6 w-6 text-primary" />
        </div>
        <div class="flex max-w-sm flex-col gap-1.5">
          <p class="text-sm font-semibold text-foreground">Newsroom sin ideas pendientes</p>
          <p class="text-xs leading-relaxed text-muted-foreground">
            Aprobá tendencias en el Radar para que aparezcan acá listas para generar copys y guiones con {{ AGENTS.COPPY_HOOK.name }}.
          </p>
        </div>
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md"
          @click="navigateTo('/tendencias')"
        >
          <span>Ir a Tendencias</span>
          <ArrowRight class="h-3.5 w-3.5" />
        </button>
      </div>

      <div v-if="approvedIdeas.length > 0">
        <div class="flex items-center justify-between border-b border-border/50 px-5 py-2">
          <span class="text-xs font-medium text-muted-foreground">
            {{ approvedIdeas.length }} {{ approvedIdeas.length === 1 ? 'idea aprobada' : 'ideas aprobadas' }}
          </span>
          <button
            type="button"
            class="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            :title="anyExpanded ? 'Colapsar todas' : 'Expandir todas'"
            @click="toggleAll"
          >
            <span>{{ anyExpanded ? 'Colapsar todas' : 'Expandir todas' }}</span>
            <component :is="anyExpanded ? ChevronsDownUp : ChevronsUpDown" class="h-3.5 w-3.5" />
          </button>
        </div>

        <ul class="flex flex-col divide-y divide-border">
          <li
            v-for="item in approvedIdeas"
            :key="item.id"
            :class="
              cn(
                'flex flex-col gap-0 transition-colors',
                item.status === 'copy_ready'
                  ? 'border-l-3 border-l-primary bg-primary/5 hover:bg-primary/8'
                  : 'border-l-3 border-l-success bg-success/5 hover:bg-success/8',
              )
            "
          >
            <button
              type="button"
              class="flex w-full items-start gap-3 px-5 py-3.5 text-left"
              :aria-expanded="isExpanded(item.id)"
              :aria-controls="`newsroom-body-${item.id}`"
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

                  <span
                    v-if="item.status === 'copy_ready'"
                    class="inline-flex items-center gap-1 rounded-md bg-primary/15 px-2 py-0.5 text-[11px] font-semibold text-primary"
                  >
                    <Wand2 class="h-3 w-3" />
                    Copy Listo
                  </span>
                  <span
                    v-else
                    class="inline-flex items-center gap-1 rounded-md bg-success/15 px-2 py-0.5 text-[11px] font-semibold text-success"
                  >
                    <Sparkles class="h-3 w-3" />
                    Lista para Redactar
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
              :id="`newsroom-body-${item.id}`"
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
                <span class="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Materia Prima ({{ AGENTS.SCRAPY.name }})
                </span>
                <div
                  v-if="item.contentIdea"
                  class="markdown-content rounded-lg border border-border/60 bg-muted/30 p-3.5 font-normal leading-relaxed text-xs text-foreground/85 shadow-xs [&>p]:mb-2.5 [&>p:last-child]:mb-0 [&>ul]:my-2 [&>ul]:list-disc [&>ul]:pl-4 [&>ul>li]:mb-1 [&>ol]:my-2 [&>ol]:list-decimal [&>ol]:pl-4 [&>ol>li]:mb-1 [&>h3]:mb-1.5 [&>h3]:mt-2.5 [&>h3:first-child]:mt-0 [&>h3]:font-semibold [&>h3]:text-foreground [&>strong]:font-semibold [&>strong]:text-foreground"
                  v-html="parseMarkdown(item.contentIdea)"
                ></div>
              </div>

              <div class="flex flex-col gap-3 rounded-xl border border-border/80 bg-background/80 p-4 shadow-xs">
                <div class="flex flex-wrap items-center justify-between gap-2.5 border-b border-border/60 pb-3">
                  <div class="flex flex-wrap items-center gap-2">
                    <label
                      :for="`platform-${item.id}`"
                      class="text-xs font-medium text-muted-foreground"
                    >
                      Formato / Red:
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
                            ? `Redactando (${AGENTS.COPPY_HOOK.name})...`
                            : item.copyFormatted
                              ? 'Regenerar Copy'
                              : `Generar Copy con ${AGENTS.COPPY_HOOK.name}`
                        }}
                      </span>
                    </button>

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

                <div
                  v-if="copyError[item.id]"
                  class="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-2.5 text-xs text-destructive"
                >
                  <AlertCircle class="h-4 w-4 shrink-0" />
                  <span class="flex-1">{{ copyError[item.id] }}</span>
                </div>

                <div
                  v-if="generatingCopy[item.id]"
                  class="flex items-center justify-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-6 text-xs text-primary"
                >
                  <Loader2 class="h-5 w-5 animate-spin" />
                  <div class="flex flex-col gap-0.5">
                    <span class="font-semibold">{{ AGENTS.COPPY_HOOK.name }} está redactando el guión...</span>
                    <span class="text-[11px] text-muted-foreground">
                      Aplicando freno de scroll, cuerpo magnético y tono local.
                    </span>
                  </div>
                </div>

                <div v-else-if="item.copySections" class="flex flex-col gap-2.5 pt-1">
                  <div class="group relative rounded-lg border border-border/70 bg-card p-3 shadow-2xs transition-all hover:border-primary/40">
                    <div class="mb-1.5 flex items-center justify-between">
                      <span class="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground">
                        <span>⚓ Hook (3s)</span>
                        <span class="text-[10px] font-normal text-muted-foreground">Freno de scroll</span>
                      </span>
                      <button
                        type="button"
                        class="inline-flex items-center gap-1 rounded-md border border-border/60 bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-foreground transition-all hover:bg-muted active:scale-95"
                        @click="copyToClipboard(item.copySections.hook, `hook-${item.id}`)"
                      >
                        <CheckCheck v-if="copiedKeys[`hook-${item.id}`]" class="h-3 w-3 text-success" />
                        <Copy v-else class="h-3 w-3 text-muted-foreground" />
                        <span :class="copiedKeys[`hook-${item.id}`] ? 'text-success font-semibold' : ''">
                          {{ copiedKeys[`hook-${item.id}`] ? '¡Copiado!' : 'Copiar' }}
                        </span>
                      </button>
                    </div>
                    <p class="text-xs leading-relaxed text-foreground/90 font-medium">
                      {{ item.copySections.hook }}
                    </p>
                  </div>

                  <div class="group relative rounded-lg border border-border/70 bg-card p-3 shadow-2xs transition-all hover:border-primary/40">
                    <div class="mb-1.5 flex items-center justify-between">
                      <span class="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground">
                        <span>📝 Cuerpo / Guión</span>
                        <span class="text-[10px] font-normal text-muted-foreground">Contenido principal</span>
                      </span>
                      <button
                        type="button"
                        class="inline-flex items-center gap-1 rounded-md border border-border/60 bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-foreground transition-all hover:bg-muted active:scale-95"
                        @click="copyToClipboard(item.copySections.body, `body-${item.id}`)"
                      >
                        <CheckCheck v-if="copiedKeys[`body-${item.id}`]" class="h-3 w-3 text-success" />
                        <Copy v-else class="h-3 w-3 text-muted-foreground" />
                        <span :class="copiedKeys[`body-${item.id}`] ? 'text-success font-semibold' : ''">
                          {{ copiedKeys[`body-${item.id}`] ? '¡Copiado!' : 'Copiar' }}
                        </span>
                      </button>
                    </div>
                    <p class="whitespace-pre-line text-xs leading-relaxed text-foreground/90">
                      {{ item.copySections.body }}
                    </p>
                  </div>

                  <div class="group relative rounded-lg border border-border/70 bg-card p-3 shadow-2xs transition-all hover:border-primary/40">
                    <div class="mb-1.5 flex items-center justify-between">
                      <span class="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground">
                        <span>💬 Caption</span>
                        <span class="text-[10px] font-normal text-muted-foreground">Descripción del post</span>
                      </span>
                      <button
                        type="button"
                        class="inline-flex items-center gap-1 rounded-md border border-border/60 bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-foreground transition-all hover:bg-muted active:scale-95"
                        @click="copyToClipboard(item.copySections.caption, `caption-${item.id}`)"
                      >
                        <CheckCheck v-if="copiedKeys[`caption-${item.id}`]" class="h-3 w-3 text-success" />
                        <Copy v-else class="h-3 w-3 text-muted-foreground" />
                        <span :class="copiedKeys[`caption-${item.id}`] ? 'text-success font-semibold' : ''">
                          {{ copiedKeys[`caption-${item.id}`] ? '¡Copiado!' : 'Copiar' }}
                        </span>
                      </button>
                    </div>
                    <p class="whitespace-pre-line text-xs leading-relaxed text-foreground/85">
                      {{ item.copySections.caption }}
                    </p>
                  </div>

                  <div
                    v-if="item.copySections.hashtags && item.copySections.hashtags.length > 0"
                    class="group relative rounded-lg border border-border/70 bg-card p-3 shadow-2xs transition-all hover:border-primary/40"
                  >
                    <div class="mb-1.5 flex items-center justify-between">
                      <span class="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground">
                        <span>#️⃣ Hashtags</span>
                      </span>
                      <button
                        type="button"
                        class="inline-flex items-center gap-1 rounded-md border border-border/60 bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-foreground transition-all hover:bg-muted active:scale-95"
                        @click="copyToClipboard(item.copySections.hashtags.join(' '), `hash-${item.id}`)"
                      >
                        <CheckCheck v-if="copiedKeys[`hash-${item.id}`]" class="h-3 w-3 text-success" />
                        <Copy v-else class="h-3 w-3 text-muted-foreground" />
                        <span :class="copiedKeys[`hash-${item.id}`] ? 'text-success font-semibold' : ''">
                          {{ copiedKeys[`hash-${item.id}`] ? '¡Copiado!' : 'Copiar' }}
                        </span>
                      </button>
                    </div>
                    <div class="flex flex-wrap gap-1.5">
                      <span
                        v-for="tag in item.copySections.hashtags"
                        :key="tag"
                        class="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                      >
                        {{ tag }}
                      </span>
                    </div>
                  </div>

                  <div v-if="item.copyFormatted" class="flex justify-end pt-1">
                    <button
                      type="button"
                      class="inline-flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-all hover:bg-primary/20 active:scale-95"
                      @click="copyToClipboard(item.copyFormatted, `full-${item.id}`)"
                    >
                      <Layers class="h-3.5 w-3.5" />
                      <span>{{ copiedKeys[`full-${item.id}`] ? '¡Copiado al Portapapeles!' : 'Copiar Todo el Formato' }}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </li>
        </ul>
      </div>

      <template #fallback>
        <div class="flex flex-col divide-y divide-border p-5">
          <div class="flex items-center gap-2 py-3 text-xs text-muted-foreground">
            <Loader2 class="h-4 w-4 animate-spin text-primary" />
            <span>Cargando Newsroom...</span>
          </div>
          <div v-for="i in 2" :key="i" class="flex flex-col gap-2.5 py-4 animate-pulse">
            <div class="flex items-center gap-2">
              <div class="h-4 w-24 rounded bg-muted"></div>
              <div class="h-4 w-16 rounded bg-muted"></div>
            </div>
            <div class="h-4 w-full rounded bg-muted"></div>
          </div>
        </div>
      </template>
    </ClientOnly>
  </section>
</template>
