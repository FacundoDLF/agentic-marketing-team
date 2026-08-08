<script setup lang="ts">
import { ref, watch, nextTick, onMounted } from 'vue'
import { watchDebounced } from '@vueuse/core'
import {
  Sparkles,
  Check,
  CheckCheck,
  Wand2,
  Loader2,
  Copy,
  Trash2,
  Bold,
  Italic,
  List,
  Quote,
  CaseSensitive,
  X,
  Plus,
} from '@lucide/vue'
import { useScraper } from '~~/features/ScraperNews'
import { agentService } from '~~/services/agentService'
import { AGENTS } from '~~/shared/constants'
import type { NewsIdea, CopySections } from '~~/entities/news/types'

const props = defineProps<{
  idea: NewsIdea
  platform: string
}>()

const emit = defineEmits<{
  (e: 'update:sections', sections: CopySections): void
  (e: 'approve', ideaId: string): void
}>()

const { updateIdeaCopy, updateIdeaStatus } = useScraper()

const localSections = ref<CopySections>({
  hook: props.idea.copySections?.hook || '',
  body: props.idea.copySections?.body || '',
  caption: props.idea.copySections?.caption || '',
  hashtags: Array.isArray(props.idea.copySections?.hashtags)
    ? [...props.idea.copySections.hashtags]
    : ['#JLMasajistas', '#Rosario', '#Kinesiologia', '#Bienestar'],
  cta: props.idea.copySections?.cta || '',
})

const newTagText = ref<string>('')
const tagInputRef = ref<HTMLInputElement | null>(null)

const hookTextareaRef = ref<HTMLTextAreaElement | null>(null)
const bodyTextareaRef = ref<HTMLTextAreaElement | null>(null)
const captionTextareaRef = ref<HTMLTextAreaElement | null>(null)

const isSaving = ref<boolean>(false)
const lastSaved = ref<Date | null>(null)
const regeneratingField = ref<Record<string, boolean>>({})
const fieldError = ref<Record<string, string>>({})
const approvedSuccess = ref<boolean>(false)
const copiedKey = ref<string>('')

// Auto-resizing dinámico
function autoResize(el: HTMLTextAreaElement | null): void {
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${el.scrollHeight}px`
}

function resizeAllTextareas(): void {
  nextTick(() => {
    autoResize(hookTextareaRef.value)
    autoResize(bodyTextareaRef.value)
    autoResize(captionTextareaRef.value)
  })
}

onMounted(() => {
  resizeAllTextareas()
})

// Sincronizar estado cuando cambia la idea activa
watch(
  () => props.idea.id,
  () => {
    localSections.value = {
      hook: props.idea.copySections?.hook || '',
      body: props.idea.copySections?.body || '',
      caption: props.idea.copySections?.caption || '',
      hashtags: Array.isArray(props.idea.copySections?.hashtags)
        ? [...props.idea.copySections.hashtags]
        : ['#JLMasajistas', '#Rosario', '#Kinesiologia', '#Bienestar'],
      cta: props.idea.copySections?.cta || '',
    }
    newTagText.value = ''
    approvedSuccess.value = false
    resizeAllTextareas()
  },
)

// Emisión reactiva inmediata a componentes visuales (SocialPreview)
watch(
  localSections,
  (val) => {
    emit('update:sections', { ...val })
  },
  { deep: true },
)

// Auto-guardado resiliente con debounce (600ms)
watchDebounced(
  localSections,
  (val) => {
    isSaving.value = true
    const tagsStr = Array.isArray(val.hashtags) ? val.hashtags.join(' ') : ''
    const formatted = `### ⚓ Hook (3s)\n${val.hook}\n\n### 📝 Cuerpo / Guión\n${val.body}\n\n### 💬 Caption\n${val.caption}\n\n### #️⃣ Hashtags\n${tagsStr}\n\n### 🎯 CTA\n${val.cta}`

    updateIdeaCopy(props.idea.id, {
      copySections: { ...val },
      copyFormatted: formatted,
      copyPlatform: props.platform,
    })

    setTimeout(() => {
      isSaving.value = false
      lastSaved.value = new Date()
    }, 250)
  },
  { deep: true, debounce: 600 },
)

// Sistema de Hashtags en Pills
function addHashtag(): void {
  const raw = newTagText.value.trim()
  if (!raw) return

  // Permitir ingresar múltiples tags separados por espacio
  const parts = raw.split(/\s+/).filter(Boolean)
  for (const part of parts) {
    const formatted = part.startsWith('#') ? part : `#${part}`
    if (!localSections.value.hashtags.includes(formatted)) {
      localSections.value.hashtags.push(formatted)
    }
  }
  newTagText.value = ''
}

function removeHashtag(index: number): void {
  localSections.value.hashtags.splice(index, 1)
}

function handleTagBackspace(): void {
  if (!newTagText.value && localSections.value.hashtags.length > 0) {
    localSections.value.hashtags.pop()
  }
}

// Transformaciones Unicode para Mini Toolbar de Formato
function toUnicodeBold(str: string): string {
  return str
    .split('')
    .map((char) => {
      const code = char.charCodeAt(0)
      if (code >= 65 && code <= 90) return String.fromCodePoint(0x1d400 + (code - 65))
      if (code >= 97 && code <= 122) return String.fromCodePoint(0x1d41a + (code - 97))
      if (code >= 48 && code <= 57) return String.fromCodePoint(0x1d7ce + (code - 48))
      return char
    })
    .join('')
}

function toUnicodeItalic(str: string): string {
  return str
    .split('')
    .map((char) => {
      const code = char.charCodeAt(0)
      if (char === 'h') return 'ℎ'
      if (code >= 65 && code <= 90) return String.fromCodePoint(0x1d434 + (code - 65))
      if (code >= 97 && code <= 122) return String.fromCodePoint(0x1d44e + (code - 97))
      return char
    })
    .join('')
}

function applyFormat(
  field: 'hook' | 'body' | 'caption',
  type: 'bold' | 'italic' | 'bullet' | 'quote' | 'caps',
  el: HTMLTextAreaElement | null,
): void {
  if (!el) return
  const start = el.selectionStart ?? 0
  const end = el.selectionEnd ?? 0
  const current = localSections.value[field] || ''
  const selected = current.substring(start, end)

  let replacement = ''
  if (type === 'bold') {
    replacement = selected ? toUnicodeBold(selected) : toUnicodeBold('negrita')
  } else if (type === 'italic') {
    replacement = selected ? toUnicodeItalic(selected) : toUnicodeItalic('cursiva')
  } else if (type === 'bullet') {
    replacement = selected
      ? selected
          .split('\n')
          .map((line) => (line.startsWith('• ') ? line : `• ${line}`))
          .join('\n')
      : '• '
  } else if (type === 'quote') {
    replacement = selected ? `"${selected}"` : '""'
  } else if (type === 'caps') {
    replacement = selected ? selected.toUpperCase() : ''
  }

  const updated = current.substring(0, start) + replacement + current.substring(end)
  localSections.value[field] = updated

  nextTick(() => {
    autoResize(el)
    el.focus()
    const newPos = start + replacement.length
    el.setSelectionRange(newPos, newPos)
  })
}

// Limpieza de bloque (Botón Eliminar)
function handleClearField(field: 'hook' | 'body' | 'caption' | 'hashtags' | 'cta'): void {
  if (field === 'hashtags') {
    localSections.value.hashtags = []
    newTagText.value = ''
  } else {
    localSections.value[field] = ''
    if (field === 'hook') autoResize(hookTextareaRef.value)
    if (field === 'body') autoResize(bodyTextareaRef.value)
    if (field === 'caption') autoResize(captionTextareaRef.value)
  }
}

// Regeneración con IA
async function handleRegenerateField(
  field: 'hook' | 'body' | 'caption' | 'cta' | 'hashtags',
): Promise<void> {
  regeneratingField.value[field] = true
  fieldError.value[field] = ''

  try {
    const res = await agentService.generateCopy(props.idea.id, props.platform, {
      headline: props.idea.headline,
      contentIdea: props.idea.contentIdea,
      sourceUrl: props.idea.sourceUrl,
      targetField: field,
      currentSections: localSections.value,
    })

    if (res.success && res.data?.sections) {
      if (field === 'hook' && res.data.sections.hook) {
        localSections.value.hook = res.data.sections.hook
      } else if (field === 'body' && res.data.sections.body) {
        localSections.value.body = res.data.sections.body
      } else if (field === 'caption' && res.data.sections.caption) {
        localSections.value.caption = res.data.sections.caption
        if (res.data.sections.hashtags?.length) {
          localSections.value.hashtags = [...res.data.sections.hashtags]
        }
      } else if (field === 'hashtags' && res.data.sections.hashtags?.length) {
        localSections.value.hashtags = [...res.data.sections.hashtags]
      } else if (field === 'cta' && res.data.sections.cta) {
        localSections.value.cta = res.data.sections.cta
      }
      resizeAllTextareas()
    }
  } catch (err: any) {
    console.error(`Error regenerando ${field}:`, err)
    fieldError.value[field] =
      err?.data?.message || err?.message || 'Error al regenerar sección con IA.'
  } finally {
    regeneratingField.value[field] = false
  }
}

async function handleCopyText(text: string, key: string): Promise<void> {
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    copiedKey.value = key
    setTimeout(() => {
      copiedKey.value = ''
    }, 2000)
  } catch (e) {
    console.warn('Error al copiar:', e)
  }
}

function handleApproveFinal(): void {
  approvedSuccess.value = true
  updateIdeaStatus(props.idea.id, 'copy_ready')

  const tagsStr = Array.isArray(localSections.value.hashtags)
    ? localSections.value.hashtags.join(' ')
    : ''
  const formatted = `### ⚓ Hook (3s)\n${localSections.value.hook}\n\n### 📝 Cuerpo / Guión\n${localSections.value.body}\n\n### 💬 Caption\n${localSections.value.caption}\n\n### #️⃣ Hashtags\n${tagsStr}\n\n### 🎯 CTA\n${localSections.value.cta}`

  updateIdeaCopy(props.idea.id, {
    copySections: { ...localSections.value },
    copyFormatted: formatted,
    copyPlatform: props.platform,
    status: 'copy_ready',
  })

  setTimeout(() => {
    emit('approve', props.idea.id)
  }, 600)
}
</script>

<template>
  <div class="relative flex flex-col rounded-xl border border-border/80 bg-card p-4 shadow-xs">
    <!-- Header del Editor con Status de Auto-guardado -->
    <div class="flex items-center justify-between border-b border-border/60 pb-3 mb-5">
      <div class="flex items-center gap-2">
        <div class="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Wand2 class="h-3.5 w-3.5" />
        </div>
        <span class="text-xs font-semibold text-foreground">Editor Activo ({{ AGENTS.COPPY_HOOK.name }})</span>
      </div>

      <div class="flex items-center gap-2 text-[11px]">
        <span
          v-if="isSaving"
          class="inline-flex items-center gap-1 text-muted-foreground animate-pulse"
        >
          <Loader2 class="h-3 w-3 animate-spin text-primary" />
          <span>Guardando...</span>
        </span>
        <span
          v-else-if="lastSaved"
          class="inline-flex items-center gap-1 text-success font-medium"
        >
          <Check class="h-3 w-3" />
          <span>Guardado auto</span>
        </span>
      </div>
    </div>

    <!-- Contenedor Principal de Campos Apilados al 100% de Ancho con Padding Inferior para Sticky Footer -->
    <div class="flex flex-col gap-5 pb-32">
      <!-- BLOQUE 1: Hook Inicial (3s) -->
      <div class="flex flex-col gap-2 rounded-xl border border-border/60 bg-muted/10 p-3">
        <div class="flex items-center justify-between gap-2 flex-wrap">
          <label for="editor-hook" class="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <span>⚓ Hook Inicial (3s)</span>
            <span class="text-[10px] font-normal text-muted-foreground">Freno de scroll</span>
          </label>
          <div class="flex items-center gap-1.5">
            <!-- Botón IA (Ícono único de chispa en ámbar) -->
            <button
              type="button"
              :disabled="regeneratingField.hook"
              title="Regenerar Hook con IA"
              class="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-0.5 text-[11px] font-medium text-foreground transition-all hover:bg-muted active:scale-95 disabled:opacity-50"
              @click="handleRegenerateField('hook')"
            >
              <Loader2 v-if="regeneratingField.hook" class="h-3.5 w-3.5 animate-spin text-primary" />
              <Sparkles v-else class="h-3.5 w-3.5 text-amber-500 fill-amber-500/20" />
              <span>{{ regeneratingField.hook ? 'IA...' : 'IA' }}</span>
            </button>
            <!-- Botón Copiar -->
            <button
              type="button"
              title="Copiar texto"
              class="inline-flex h-6 w-6 items-center justify-center rounded-md border border-border/60 bg-background text-muted-foreground transition-colors hover:text-foreground active:scale-95"
              @click="handleCopyText(localSections.hook, 'hook')"
            >
              <CheckCheck v-if="copiedKey === 'hook'" class="h-3.5 w-3.5 text-success" />
              <Copy v-else class="h-3.5 w-3.5" />
            </button>
            <!-- Botón Eliminar -->
            <button
              type="button"
              title="Vaciar Hook"
              class="inline-flex h-6 w-6 items-center justify-center rounded-md border border-border/60 bg-background text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive active:scale-95"
              @click="handleClearField('hook')"
            >
              <Trash2 class="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <!-- Mini Toolbar de Formato -->
        <div class="flex items-center gap-1 border-y border-border/40 py-1 bg-background/40 px-1 rounded">
          <button
            type="button"
            title="Negrita (Unicode)"
            class="inline-flex h-5 w-5 items-center justify-center rounded text-[11px] font-bold text-muted-foreground hover:bg-muted hover:text-foreground"
            @click="applyFormat('hook', 'bold', hookTextareaRef)"
          >
            B
          </button>
          <button
            type="button"
            title="Cursiva (Unicode)"
            class="inline-flex h-5 w-5 items-center justify-center rounded text-[11px] italic font-serif text-muted-foreground hover:bg-muted hover:text-foreground"
            @click="applyFormat('hook', 'italic', hookTextareaRef)"
          >
            I
          </button>
          <button
            type="button"
            title="Comillas"
            class="inline-flex h-5 w-5 items-center justify-center rounded text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground"
            @click="applyFormat('hook', 'quote', hookTextareaRef)"
          >
            “”
          </button>
          <button
            type="button"
            title="MAYÚSCULAS"
            class="inline-flex h-5 px-1 items-center justify-center rounded text-[9px] font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
            @click="applyFormat('hook', 'caps', hookTextareaRef)"
          >
            AA
          </button>
        </div>

        <textarea
          id="editor-hook"
          ref="hookTextareaRef"
          v-model="localSections.hook"
          rows="2"
          placeholder="Ej: ¿Sentís dolor lumbar al levantarte de la silla? Hacé esto..."
          class="w-full resize-none overflow-hidden rounded-lg border border-border bg-background p-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 transition-colors focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/30"
          @input="autoResize($event.target as HTMLTextAreaElement)"
        ></textarea>
        <span v-if="fieldError.hook" class="text-[11px] text-destructive">{{ fieldError.hook }}</span>
      </div>

      <!-- BLOQUE 2: Cuerpo / Guión -->
      <div class="flex flex-col gap-2 rounded-xl border border-border/60 bg-muted/10 p-3">
        <div class="flex items-center justify-between gap-2 flex-wrap">
          <label for="editor-body" class="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <span>📝 Cuerpo / Guión</span>
            <span class="text-[10px] font-normal text-muted-foreground">Contenido principal</span>
          </label>
          <div class="flex items-center gap-1.5">
            <!-- Botón IA (Ícono único en ámbar) -->
            <button
              type="button"
              :disabled="regeneratingField.body"
              title="Regenerar Cuerpo con IA"
              class="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-0.5 text-[11px] font-medium text-foreground transition-all hover:bg-muted active:scale-95 disabled:opacity-50"
              @click="handleRegenerateField('body')"
            >
              <Loader2 v-if="regeneratingField.body" class="h-3.5 w-3.5 animate-spin text-primary" />
              <Sparkles v-else class="h-3.5 w-3.5 text-amber-500 fill-amber-500/20" />
              <span>{{ regeneratingField.body ? 'IA...' : 'IA' }}</span>
            </button>
            <!-- Botón Copiar -->
            <button
              type="button"
              title="Copiar texto"
              class="inline-flex h-6 w-6 items-center justify-center rounded-md border border-border/60 bg-background text-muted-foreground transition-colors hover:text-foreground active:scale-95"
              @click="handleCopyText(localSections.body, 'body')"
            >
              <CheckCheck v-if="copiedKey === 'body'" class="h-3.5 w-3.5 text-success" />
              <Copy v-else class="h-3.5 w-3.5" />
            </button>
            <!-- Botón Eliminar -->
            <button
              type="button"
              title="Vaciar Cuerpo"
              class="inline-flex h-6 w-6 items-center justify-center rounded-md border border-border/60 bg-background text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive active:scale-95"
              @click="handleClearField('body')"
            >
              <Trash2 class="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <!-- Mini Toolbar de Formato -->
        <div class="flex items-center gap-1 border-y border-border/40 py-1 bg-background/40 px-1 rounded">
          <button
            type="button"
            title="Negrita (Unicode)"
            class="inline-flex h-5 w-5 items-center justify-center rounded text-[11px] font-bold text-muted-foreground hover:bg-muted hover:text-foreground"
            @click="applyFormat('body', 'bold', bodyTextareaRef)"
          >
            B
          </button>
          <button
            type="button"
            title="Cursiva (Unicode)"
            class="inline-flex h-5 w-5 items-center justify-center rounded text-[11px] italic font-serif text-muted-foreground hover:bg-muted hover:text-foreground"
            @click="applyFormat('body', 'italic', bodyTextareaRef)"
          >
            I
          </button>
          <button
            type="button"
            title="Viñeta (Lista)"
            class="inline-flex h-5 w-5 items-center justify-center rounded text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground"
            @click="applyFormat('body', 'bullet', bodyTextareaRef)"
          >
            •
          </button>
          <button
            type="button"
            title="Comillas"
            class="inline-flex h-5 w-5 items-center justify-center rounded text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground"
            @click="applyFormat('body', 'quote', bodyTextareaRef)"
          >
            “”
          </button>
        </div>

        <textarea
          id="editor-body"
          ref="bodyTextareaRef"
          v-model="localSections.body"
          rows="4"
          placeholder="Desarrollo del contenido, acotaciones visuales y explicación paso a paso..."
          class="w-full resize-none overflow-hidden rounded-lg border border-border bg-background p-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 transition-colors focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/30"
          @input="autoResize($event.target as HTMLTextAreaElement)"
        ></textarea>
        <span v-if="fieldError.body" class="text-[11px] text-destructive">{{ fieldError.body }}</span>
      </div>

      <!-- BLOQUE 3: Caption -->
      <div class="flex flex-col gap-2 rounded-xl border border-border/60 bg-muted/10 p-3">
        <div class="flex items-center justify-between gap-2 flex-wrap">
          <label for="editor-caption" class="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <span>💬 Caption</span>
            <span class="text-[10px] font-normal text-muted-foreground">Descripción del post</span>
          </label>
          <div class="flex items-center gap-1.5">
            <!-- Botón IA (Ícono único en ámbar) -->
            <button
              type="button"
              :disabled="regeneratingField.caption"
              title="Regenerar Caption con IA"
              class="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-0.5 text-[11px] font-medium text-foreground transition-all hover:bg-muted active:scale-95 disabled:opacity-50"
              @click="handleRegenerateField('caption')"
            >
              <Loader2 v-if="regeneratingField.caption" class="h-3.5 w-3.5 animate-spin text-primary" />
              <Sparkles v-else class="h-3.5 w-3.5 text-amber-500 fill-amber-500/20" />
              <span>{{ regeneratingField.caption ? 'IA...' : 'IA' }}</span>
            </button>
            <!-- Botón Copiar -->
            <button
              type="button"
              title="Copiar texto"
              class="inline-flex h-6 w-6 items-center justify-center rounded-md border border-border/60 bg-background text-muted-foreground transition-colors hover:text-foreground active:scale-95"
              @click="handleCopyText(localSections.caption, 'caption')"
            >
              <CheckCheck v-if="copiedKey === 'caption'" class="h-3.5 w-3.5 text-success" />
              <Copy v-else class="h-3.5 w-3.5" />
            </button>
            <!-- Botón Eliminar -->
            <button
              type="button"
              title="Vaciar Caption"
              class="inline-flex h-6 w-6 items-center justify-center rounded-md border border-border/60 bg-background text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive active:scale-95"
              @click="handleClearField('caption')"
            >
              <Trash2 class="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <!-- Mini Toolbar de Formato -->
        <div class="flex items-center gap-1 border-y border-border/40 py-1 bg-background/40 px-1 rounded">
          <button
            type="button"
            title="Negrita (Unicode)"
            class="inline-flex h-5 w-5 items-center justify-center rounded text-[11px] font-bold text-muted-foreground hover:bg-muted hover:text-foreground"
            @click="applyFormat('caption', 'bold', captionTextareaRef)"
          >
            B
          </button>
          <button
            type="button"
            title="Cursiva (Unicode)"
            class="inline-flex h-5 w-5 items-center justify-center rounded text-[11px] italic font-serif text-muted-foreground hover:bg-muted hover:text-foreground"
            @click="applyFormat('caption', 'italic', captionTextareaRef)"
          >
            I
          </button>
          <button
            type="button"
            title="Viñeta (Lista)"
            class="inline-flex h-5 w-5 items-center justify-center rounded text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground"
            @click="applyFormat('caption', 'bullet', captionTextareaRef)"
          >
            •
          </button>
          <button
            type="button"
            title="Comillas"
            class="inline-flex h-5 w-5 items-center justify-center rounded text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground"
            @click="applyFormat('caption', 'quote', captionTextareaRef)"
          >
            “”
          </button>
        </div>

        <textarea
          id="editor-caption"
          ref="captionTextareaRef"
          v-model="localSections.caption"
          rows="3"
          placeholder="Texto persuasivo para el feed de la red social..."
          class="w-full resize-none overflow-hidden rounded-lg border border-border bg-background p-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 transition-colors focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/30"
          @input="autoResize($event.target as HTMLTextAreaElement)"
        ></textarea>
        <span v-if="fieldError.caption" class="text-[11px] text-destructive">{{ fieldError.caption }}</span>
      </div>

      <!-- BLOQUE 4: Hashtags (Pills Tag Input al 100% de ancho) -->
      <div class="flex flex-col gap-2 rounded-xl border border-border/60 bg-muted/10 p-3">
        <div class="flex items-center justify-between gap-2 flex-wrap">
          <label class="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <span>#️⃣ Hashtags</span>
            <span class="text-[10px] font-normal text-muted-foreground">Etiquetas clave</span>
          </label>
          <div class="flex items-center gap-1.5">
            <!-- Botón IA (Ícono único en ámbar) -->
            <button
              type="button"
              :disabled="regeneratingField.hashtags"
              title="Regenerar Hashtags con IA"
              class="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-0.5 text-[11px] font-medium text-foreground transition-all hover:bg-muted active:scale-95 disabled:opacity-50"
              @click="handleRegenerateField('hashtags')"
            >
              <Loader2 v-if="regeneratingField.hashtags" class="h-3.5 w-3.5 animate-spin text-primary" />
              <Sparkles v-else class="h-3.5 w-3.5 text-amber-500 fill-amber-500/20" />
              <span>{{ regeneratingField.hashtags ? 'IA...' : 'IA' }}</span>
            </button>
            <!-- Botón Copiar -->
            <button
              type="button"
              title="Copiar todos los hashtags"
              class="inline-flex h-6 w-6 items-center justify-center rounded-md border border-border/60 bg-background text-muted-foreground transition-colors hover:text-foreground active:scale-95"
              @click="handleCopyText(localSections.hashtags.join(' '), 'hashtags')"
            >
              <CheckCheck v-if="copiedKey === 'hashtags'" class="h-3.5 w-3.5 text-success" />
              <Copy v-else class="h-3.5 w-3.5" />
            </button>
            <!-- Botón Eliminar -->
            <button
              type="button"
              title="Vaciar todos los hashtags"
              class="inline-flex h-6 w-6 items-center justify-center rounded-md border border-border/60 bg-background text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive active:scale-95"
              @click="handleClearField('hashtags')"
            >
              <Trash2 class="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <!-- Tag Input Visual con Pills -->
        <div
          class="flex flex-wrap items-center gap-1.5 p-2 rounded-lg border border-border bg-background focus-within:border-primary/60 focus-within:ring-1 focus-within:ring-primary/30 min-h-[42px] cursor-text"
          @click="tagInputRef?.focus()"
        >
          <!-- Lista de Pills Activas -->
          <span
            v-for="(tag, idx) in localSections.hashtags"
            :key="idx"
            class="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/25 px-2.5 py-0.5 text-xs font-semibold text-primary transition-all hover:bg-primary/20"
          >
            <span>{{ tag.startsWith('#') ? tag : `#${tag}` }}</span>
            <button
              type="button"
              title="Eliminar este tag"
              class="h-3.5 w-3.5 rounded-full inline-flex items-center justify-center hover:bg-primary/30 text-primary/80 hover:text-primary transition-colors"
              @click.stop="removeHashtag(idx)"
            >
              <X class="h-2.5 w-2.5" />
            </button>
          </span>

          <!-- Input para escribir nuevos tags -->
          <input
            ref="tagInputRef"
            v-model="newTagText"
            type="text"
            placeholder="Escribí un tag y pulsá Espacio o Enter..."
            class="flex-1 min-w-[150px] bg-transparent text-xs text-foreground placeholder:text-muted-foreground/60 outline-none border-none p-1"
            @keydown.space.prevent="addHashtag"
            @keydown.enter.prevent="addHashtag"
            @keydown.,.prevent="addHashtag"
            @keydown.backspace="handleTagBackspace"
          />
        </div>
        <span v-if="fieldError.hashtags" class="text-[11px] text-destructive">{{ fieldError.hashtags }}</span>
      </div>

      <!-- BLOQUE 5: Llamado a la Acción (CTA) al 100% de ancho -->
      <div class="flex flex-col gap-2 rounded-xl border border-border/60 bg-muted/10 p-3">
        <div class="flex items-center justify-between gap-2 flex-wrap">
          <label for="editor-cta" class="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <span>🎯 Llamado a la Acción (CTA)</span>
            <span class="text-[10px] font-normal text-muted-foreground">Conversión y cierre</span>
          </label>
          <div class="flex items-center gap-1.5">
            <!-- Botón IA (Ícono único en ámbar) -->
            <button
              type="button"
              :disabled="regeneratingField.cta"
              title="Regenerar CTA con IA"
              class="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-0.5 text-[11px] font-medium text-foreground transition-all hover:bg-muted active:scale-95 disabled:opacity-50"
              @click="handleRegenerateField('cta')"
            >
              <Loader2 v-if="regeneratingField.cta" class="h-3.5 w-3.5 animate-spin text-primary" />
              <Sparkles v-else class="h-3.5 w-3.5 text-amber-500 fill-amber-500/20" />
              <span>{{ regeneratingField.cta ? 'IA...' : 'IA' }}</span>
            </button>
            <!-- Botón Copiar -->
            <button
              type="button"
              title="Copiar CTA"
              class="inline-flex h-6 w-6 items-center justify-center rounded-md border border-border/60 bg-background text-muted-foreground transition-colors hover:text-foreground active:scale-95"
              @click="handleCopyText(localSections.cta, 'cta')"
            >
              <CheckCheck v-if="copiedKey === 'cta'" class="h-3.5 w-3.5 text-success" />
              <Copy v-else class="h-3.5 w-3.5" />
            </button>
            <!-- Botón Eliminar -->
            <button
              type="button"
              title="Vaciar CTA"
              class="inline-flex h-6 w-6 items-center justify-center rounded-md border border-border/60 bg-background text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive active:scale-95"
              @click="handleClearField('cta')"
            >
              <Trash2 class="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <input
          id="editor-cta"
          v-model="localSections.cta"
          type="text"
          placeholder="Ej: Envianos un mensaje privado o agendá tu sesión en el link de la bio."
          class="h-9 w-full rounded-lg border border-border bg-background px-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 transition-colors focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/30"
        />
        <span v-if="fieldError.cta" class="text-[11px] text-destructive">{{ fieldError.cta }}</span>
      </div>
    </div>

    <!-- Sticky Footer para el CTA Principal (bg-background/90 con backdrop-blur-sm) -->
    <div class="sticky bottom-0 z-10 -mx-4 -mb-4 flex items-center justify-end gap-2.5 rounded-b-xl border-t border-border/80 bg-background/90 px-4 py-3 shadow-md backdrop-blur-sm">
      <button
        type="button"
        :disabled="approvedSuccess || !localSections.hook || !localSections.body"
        class="inline-flex h-9 items-center gap-2 rounded-lg bg-success px-4 text-xs font-semibold text-success-foreground shadow-sm transition-all hover:bg-success/90 hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        @click="handleApproveFinal"
      >
        <CheckCheck v-if="approvedSuccess" class="h-4 w-4 text-success-foreground" />
        <Check v-else class="h-4 w-4" />
        <span>{{ approvedSuccess ? '¡Copy Aprobado!' : 'Aprobar Copy Final' }}</span>
      </button>
    </div>
  </div>
</template>
