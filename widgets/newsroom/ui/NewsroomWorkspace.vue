<script setup lang="ts">
import { ref } from 'vue'
import { marked } from 'marked'
import {
  FileText,
  ExternalLink,
  AlertCircle,
  Loader2,
  Trash2,
  Wand2,
  ChevronDown,
  BookOpen,
} from '@lucide/vue'
import { AGENTS, SOCIAL_PLATFORMS } from '~~/shared/constants'
import CopyEditor from './CopyEditor.vue'
import NewsroomSidebar from './NewsroomSidebar.vue'
import type { NewsIdea, CopySections } from '~~/entities/news/types'

const props = defineProps<{
  idea: NewsIdea | null
  ideas: NewsIdea[]
  activeIdeaId: string | null
  fetchingIdeas: boolean
  platform: string
  generating: boolean
  errorMsg?: string
  liveSections: CopySections
}>()

const emit = defineEmits<{
  (e: 'selectIdea', id: string): void
  (e: 'refreshIdeas'): void
  (e: 'generateCopy', platform: string): void
  (e: 'changePlatform', platform: string): void
  (e: 'archive', id: string): void
  (e: 'updateSections', sections: CopySections): void
  (e: 'approve', id: string): void
}>()

const showRawData = ref<boolean>(false)

function parseMarkdown(content?: string): string {
  if (!content) return ''
  try {
    const cleanText = content.replace(/\\n/g, '\n')
    return marked.parse(cleanText, { breaks: true, gfm: true, async: false }) as string
  } catch {
    return content
  }
}
</script>

<template>
  <main class="flex h-full flex-col overflow-hidden rounded-xl border border-border/80 bg-card shadow-xs">
    <!-- Empty State (No idea selected) -->
    <div
      v-if="!idea"
      class="flex h-full flex-col items-center justify-center gap-4 p-8 text-center"
    >
      <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground shadow-xs">
        <FileText class="h-7 w-7 text-primary" />
      </div>
      <div class="flex max-w-sm flex-col gap-1.5">
        <h3 class="text-base font-semibold text-foreground">Selecciona una idea del Inbox</h3>
        <p class="text-xs leading-relaxed text-muted-foreground">
          Elegí cualquier noticia aprobada del Inbox para redactar el guión y previsualizarlo en tiempo real.
        </p>
      </div>
    </div>

    <!-- Workspace de Idea Activa -->
    <div v-else class="flex h-full flex-col overflow-hidden">
      <!-- Top Bar del Workspace (Header Rediseñado sin Overlap) -->
      <header class="flex flex-col gap-3.5 border-b border-border/70 p-4 bg-card/60 shrink-0">
        <!-- Fila 1: Badges a la izquierda, Selector de Plataforma y Botones de Acción a la derecha -->
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <span class="rounded-md bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
              {{ platform }}
            </span>
            <span
              v-if="idea.status === 'copy_ready'"
              class="rounded-md bg-success/15 px-2.5 py-1 text-xs font-semibold text-success"
            >
              Copy Listo
            </span>
            <span
              v-else
              class="rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
            >
              Borrador
            </span>
          </div>

          <!-- Acciones alineadas a la derecha -->
          <div class="flex items-center gap-2">
            <select
              :value="platform"
              :disabled="generating"
              class="h-8.5 rounded-lg border border-border bg-background px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted focus:outline-none focus:ring-1 focus:ring-primary/40 disabled:opacity-50 cursor-pointer"
              @change="emit('changePlatform', ($event.target as HTMLSelectElement).value)"
            >
              <option v-for="p in SOCIAL_PLATFORMS" :key="p.id" :value="p.label">{{ p.label }}</option>
            </select>

            <button
              type="button"
              :disabled="generating"
              class="inline-flex h-8.5 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-xs font-semibold text-primary-foreground shadow-xs transition-all hover:bg-primary/90 active:scale-95 disabled:opacity-60"
              @click="emit('generateCopy', platform)"
            >
              <Loader2 v-if="generating" class="h-3.5 w-3.5 animate-spin" />
              <Wand2 v-else class="h-3.5 w-3.5" />
              <span>{{ generating ? 'Redactando...' : idea.copyFormatted ? 'Regenerar Copy' : 'Generar Copy' }}</span>
            </button>

            <button
              type="button"
              title="Archivar idea"
              class="inline-flex h-8.5 w-8.5 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive active:scale-95"
              @click="emit('archive', idea.id)"
            >
              <Trash2 class="h-4 w-4" />
            </button>
          </div>
        </div>

        <!-- Fila 2: Título de la Noticia con 100% de Ancho (Sin colisiones) -->
        <h1 class="text-base sm:text-lg lg:text-xl font-bold leading-snug text-foreground tracking-tight w-full">
          {{ idea.headline }}
        </h1>

        <!-- Fila 3: Acordeón Sutil de Materia Prima (Scrapy Agent) -->
        <div class="rounded-lg border border-border/60 bg-muted/20 text-xs overflow-hidden">
          <button
            type="button"
            class="flex w-full items-center justify-between px-3 py-2 text-muted-foreground hover:text-foreground transition-colors"
            @click="showRawData = !showRawData"
          >
            <div class="flex items-center gap-2">
              <BookOpen class="h-3.5 w-3.5 text-primary" />
              <span class="font-medium text-[11px]">Materia Prima ({{ AGENTS.SCRAPY.name }})</span>
            </div>
            <div class="flex items-center gap-2">
              <a
                v-if="idea.sourceUrl && idea.sourceUrl !== '#'"
                :href="idea.sourceUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1 text-[11px] text-primary/80 hover:underline"
                @click.stop
              >
                <span>Fuente</span>
                <ExternalLink class="h-3 w-3" />
              </a>
              <ChevronDown :class="['h-3.5 w-3.5 transition-transform duration-200', showRawData ? 'rotate-180' : '']" />
            </div>
          </button>

          <div
            v-show="showRawData"
            class="border-t border-border/40 p-3 bg-background/50 leading-relaxed text-foreground/85"
            v-html="parseMarkdown(idea.contentIdea)"
          ></div>
        </div>
      </header>

      <!-- Área de Scroll Vertical Independiente del Workspace -->
      <div class="flex-1 overflow-y-auto">
        <!-- Error Alert -->
        <div
          v-if="errorMsg"
          class="mx-4 mt-3 flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-2.5 text-xs text-destructive"
        >
          <AlertCircle class="h-4 w-4 shrink-0" />
          <span>{{ errorMsg }}</span>
        </div>

        <!-- Loading Banner Coppy-Hook -->
        <div
          v-if="generating"
          class="mx-4 mt-3 flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs text-primary shadow-xs"
        >
          <Loader2 class="h-5 w-5 animate-spin shrink-0" />
          <div class="flex flex-col">
            <span class="font-semibold">{{ AGENTS.COPPY_HOOK.name }} está redactando el guión y copy...</span>
            <span class="text-[11px] text-muted-foreground">Generando freno de scroll, cuerpo magnético y tono para {{ platform }}.</span>
          </div>
        </div>

        <!-- Split-Screen 50/50: 1. Editor Activo (Columna Central) + 2. Inbox de Ideas (Columna Derecha) -->
        <div class="p-4">
          <div class="grid grid-cols-1 xl:grid-cols-2 gap-5 items-start">
            <!-- 1. Editor Activo (Columna Central) -->
            <CopyEditor
              :idea="idea"
              :platform="platform"
              @update:sections="emit('updateSections', $event)"
              @approve="emit('approve', $event)"
            />

            <!-- 2. Inbox de Ideas (Columna Derecha) -->
            <div class="h-[750px] xl:h-[calc(100vh-280px)] min-h-[550px]">
              <NewsroomSidebar
                :ideas="ideas"
                :active-idea-id="activeIdeaId"
                :fetching="fetchingIdeas"
                @select="emit('selectIdea', $event)"
                @refresh="emit('refreshIdeas')"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>
