<script setup lang="ts">
/**
 * LatestCopyWidget — Borradores agent (Coppy-Hook Agent) latest social copy mockup.
 *
 * FSD Layer: widgets/latest-copy
 */
import { Heart, MessageCircle, Send, Bookmark, FileText } from '@lucide/vue'
import { AGENTS } from '~~/shared/constants/agents'
</script>

<template>
  <section class="flex flex-col rounded-xl border border-border bg-card">
    <header class="flex items-center gap-2 border-b border-border px-5 py-4">
      <div
        class="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground"
      >
        <FileText class="h-4 w-4" />
      </div>
      <div>
        <h2 class="text-sm font-semibold">Últimos Copys Generados</h2>
        <p class="text-xs text-muted-foreground">Borradores ({{ AGENTS.COPPY_HOOK.name }})</p>
      </div>
      <span
        class="ml-auto rounded-md bg-chart-5/15 px-2 py-1 text-xs font-medium text-chart-5"
      >
        En Revisión
      </span>
    </header>

    <div class="p-5">
      <article class="overflow-hidden rounded-xl border border-border">
        <!-- Post Header -->
        <div class="flex items-center gap-2.5 px-3 py-2.5">
          <div
            class="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground"
          >
            MA
          </div>
          <div class="flex flex-col leading-tight">
            <span class="text-xs font-semibold">marketing.ai</span>
            <span class="text-[10px] text-muted-foreground">
              Publicación sugerida
            </span>
          </div>
        </div>

        <!-- Post Image -->
        <div class="relative aspect-square w-full overflow-hidden bg-muted">
          <img
            src="/instagram-post.png"
            alt="Vista previa de publicación de Instagram generada por IA"
            class="h-full w-full object-cover"
            loading="lazy"
          />
        </div>

        <!-- Action Icons -->
        <div class="flex items-center gap-4 px-3 pt-3 text-foreground">
          <button type="button" aria-label="Me gusta" class="hover:opacity-80">
            <Heart class="h-5 w-5" />
          </button>
          <button type="button" aria-label="Comentar" class="hover:opacity-80">
            <MessageCircle class="h-5 w-5" />
          </button>
          <button type="button" aria-label="Compartir" class="hover:opacity-80">
            <Send class="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Guardar"
            class="ml-auto hover:opacity-80"
          >
            <Bookmark class="h-5 w-5" />
          </button>
        </div>

        <!-- Copy / Caption -->
        <p class="px-3 pb-4 pt-2 text-xs leading-relaxed">
          <span class="font-semibold">marketing.ai</span>
          La IA generativa ya está redefiniendo el marketing B2B. Descubre cómo
          aumentar tu conversión un 40% sin ampliar tu equipo. 🚀
          <span class="text-primary">#MarketingAI #B2B #Growth</span>
        </p>
      </article>
    </div>
  </section>
</template>
