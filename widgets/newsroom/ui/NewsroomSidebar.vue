<script setup lang="ts">
import { computed } from 'vue'
import {
  FileText,
  Sparkles,
  RefreshCw,
  Loader2,
  ArrowRight,
  Inbox,
  CheckCircle2,
} from '@lucide/vue'
import { AGENTS } from '~~/shared/constants'
import { cn } from '~~/shared/lib/utils'
import type { NewsIdea } from '~~/entities/news/types'

const props = defineProps<{
  ideas: NewsIdea[]
  activeIdeaId: string | null
  fetching: boolean
}>()

const emit = defineEmits<{
  (e: 'select', id: string): void
  (e: 'refresh'): void
}>()

const readyCount = computed(
  () => props.ideas.filter((i) => i.status === 'copy_ready').length,
)

function formatNewsDate(dateStr?: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''

  const day = String(d.getDate()).padStart(2, '0')
  const months = [
    'Ene',
    'Feb',
    'Mar',
    'Abr',
    'May',
    'Jun',
    'Jul',
    'Ago',
    'Sep',
    'Oct',
    'Nov',
    'Dic',
  ]
  const month = months[d.getMonth()]
  return `${day} ${month}`
}
</script>

<template>
  <aside class="flex h-full flex-col rounded-xl border border-border/80 bg-card shadow-xs overflow-hidden">
    <!-- Header del Inbox (Fijo arriba) -->
    <header class="flex items-center justify-between border-b border-border/70 px-4 py-3.5 bg-card/60 shrink-0">
      <div class="flex items-center gap-2.5">
        <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          <Inbox class="h-4 w-4 text-primary" />
        </div>
        <div class="flex flex-col">
          <div class="flex items-center gap-1.5">
            <h2 class="text-xs font-bold uppercase tracking-wider text-foreground">
              Inbox de Ideas
            </h2>
            <span class="rounded-full bg-primary/10 px-1.5 py-0.2 text-[10px] font-bold text-primary">
              {{ ideas.length }}
            </span>
          </div>
          <span class="text-[11px] text-muted-foreground">
            {{ readyCount }} {{ readyCount === 1 ? 'copy listo' : 'copys listos' }}
          </span>
        </div>
      </div>

      <button
        type="button"
        :disabled="fetching"
        title="Actualizar ideas"
        class="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-all hover:bg-muted hover:text-foreground disabled:opacity-50"
        @click="emit('refresh')"
      >
        <RefreshCw :class="['h-3.5 w-3.5', fetching ? 'animate-spin' : '']" />
      </button>
    </header>

    <!-- Lista de Tarjetas Compactas con Scroll Vertical Interno Independiente -->
    <div class="flex-1 overflow-y-auto divide-y divide-border/60">
      <!-- Loading State -->
      <div v-if="fetching && ideas.length === 0" class="flex flex-col p-4 gap-3">
        <div class="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 class="h-3.5 w-3.5 animate-spin text-primary" />
          <span>Cargando ideas aprobadas...</span>
        </div>
        <div v-for="i in 3" :key="i" class="flex flex-col gap-2 p-3 rounded-lg border border-border/40 animate-pulse bg-muted/20">
          <div class="flex items-center justify-between">
            <div class="h-3.5 w-20 rounded bg-muted"></div>
            <div class="h-3.5 w-12 rounded bg-muted"></div>
          </div>
          <div class="h-4 w-full rounded bg-muted"></div>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="ideas.length === 0"
        class="flex flex-col items-center justify-center gap-3 p-6 text-center"
      >
        <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
          <Sparkles class="h-5 w-5 text-primary" />
        </div>
        <div class="flex flex-col gap-1">
          <p class="text-xs font-semibold text-foreground">Sin ideas pendientes</p>
          <p class="text-[11px] leading-relaxed text-muted-foreground">
            Aprobá tendencias en el Radar para redactar con {{ AGENTS.COPPY_HOOK.name }}.
          </p>
        </div>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-xs transition-all hover:bg-primary/90"
          @click="navigateTo('/tendencias')"
        >
          <span>Ir a Tendencias</span>
          <ArrowRight class="h-3 w-3" />
        </button>
      </div>

      <!-- Tarjetas de Ideas con Indicador Lateral y Contraste Mejorado -->
      <button
        v-for="item in ideas"
        :key="item.id"
        type="button"
        :class="
          cn(
            'group flex w-full flex-col gap-2 p-3.5 text-left transition-all relative border-l-4 rounded-r-lg',
            activeIdeaId === item.id
              ? 'border-l-primary bg-muted/70 dark:bg-muted/50 shadow-xs'
              : 'border-l-transparent hover:bg-muted/40 text-muted-foreground hover:text-foreground',
          )
        "
        @click="emit('select', item.id)"
      >
        <!-- Header de la Tarjeta Compacta -->
        <div class="flex items-center justify-between gap-1.5 text-[11px]">
          <div class="flex items-center gap-1.5 min-w-0">
            <span
              v-if="item.platforms?.[0]"
              :class="
                cn(
                  'truncate rounded px-1.5 py-0.5 font-medium text-[10px]',
                  activeIdeaId === item.id
                    ? 'bg-primary/20 text-primary font-semibold'
                    : 'bg-background border border-border/60 text-foreground',
                )
              "
            >
              {{ item.platforms[0] }}
            </span>
            <span v-if="formatNewsDate(item.publishedAt)" class="text-muted-foreground text-[10px]">
              {{ formatNewsDate(item.publishedAt) }}
            </span>
          </div>

          <!-- Status Badge -->
          <span
            v-if="item.status === 'copy_ready'"
            class="inline-flex shrink-0 items-center gap-1 rounded-md bg-primary/20 px-1.5 py-0.5 text-[10px] font-semibold text-primary"
          >
            <CheckCircle2 class="h-2.5 w-2.5" />
            <span>Listo</span>
          </span>
          <span
            v-else
            class="inline-flex shrink-0 items-center gap-1 rounded-md bg-success/20 px-1.5 py-0.5 text-[10px] font-semibold text-success"
          >
            <Sparkles class="h-2.5 w-2.5" />
            <span>Por Redactar</span>
          </span>
        </div>

        <!-- Headline Truncado a 2 líneas -->
        <p
          :class="
            cn(
              'line-clamp-2 text-xs leading-snug transition-colors',
              activeIdeaId === item.id
                ? 'font-bold text-foreground'
                : 'font-medium text-foreground/80 group-hover:text-foreground',
            )
          "
        >
          {{ item.headline }}
        </p>
      </button>
    </div>
  </aside>
</template>
