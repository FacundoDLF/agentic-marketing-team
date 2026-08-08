<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  Music,
  MoreHorizontal,
  Upload,
  CheckCircle2,
  X,
  ChevronLeft,
  ChevronRight,
  Plus,
  ThumbsUp,
  ThumbsDown,
  Share2,
  Repeat,
  Smile,
  Disc3,
  ArrowLeft,
  MoreVertical,
  Layers,
  FileText,
  Camera,
  Maximize2,
} from '@lucide/vue'
import { findPlatform, type SocialPlatform } from '~~/shared/constants'
import type { CopySections } from '~~/entities/news/types'

interface MediaItem {
  url: string
  isVideo: boolean
  name: string
}

const props = defineProps<{
  sections: CopySections
  platform: string
  headline?: string
}>()

const mediaList = ref<MediaItem[]>([])
const activeSlideIndex = ref<number>(0)
const isDragging = ref<boolean>(false)
const fileInputRef = ref<HTMLInputElement | null>(null)
const liked = ref<boolean>(false)
const saved = ref<boolean>(false)

// SSOT: Centralized platform configuration
const platformConfig = computed<SocialPlatform>(() => findPlatform(props.platform))
const platformKey = computed(() => platformConfig.value.id)

const activeSlide = computed(() => mediaList.value[activeSlideIndex.value] || null)

function triggerFileInput(): void {
  fileInputRef.value?.click()
}

function handleFileUpload(e: Event): void {
  const target = e.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    addFiles(Array.from(target.files))
  }
  // Reset input value to allow selecting the same file again if needed
  target.value = ''
}

function handleDrop(e: DragEvent): void {
  isDragging.value = false
  if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
    addFiles(Array.from(e.dataTransfer.files))
  }
}

function addFiles(files: File[]): void {
  const max = platformConfig.value.maxMediaFiles || 1
  const validFiles = files.filter(
    (f) => f.type.startsWith('image/') || f.type.startsWith('video/')
  )

  if (validFiles.length === 0) return

  if (max === 1) {
    // Reemplazo de archivo único
    mediaList.value.forEach((item) => {
      if (item.url.startsWith('blob:')) URL.revokeObjectURL(item.url)
    })
    const first = validFiles[0]
    if (first) {
      mediaList.value = [
        {
          url: URL.createObjectURL(first),
          isVideo: first.type.startsWith('video/'),
          name: first.name,
        },
      ]
      activeSlideIndex.value = 0
    }
    return
  }

  // Carrusel / Múltiples archivos: agregar respetando el límite máximo
  const availableSlots = max - mediaList.value.length
  const filesToAdd = validFiles.slice(0, Math.max(0, availableSlots))

  for (const file of filesToAdd) {
    mediaList.value.push({
      url: URL.createObjectURL(file),
      isVideo: file.type.startsWith('video/'),
      name: file.name,
    })
  }

  if (mediaList.value.length > 0 && activeSlideIndex.value >= mediaList.value.length) {
    activeSlideIndex.value = 0
  }
}

function selectSlide(index: number): void {
  if (index >= 0 && index < mediaList.value.length) {
    activeSlideIndex.value = index
  }
}

function prevSlide(): void {
  if (mediaList.value.length <= 1) return
  activeSlideIndex.value =
    activeSlideIndex.value === 0 ? mediaList.value.length - 1 : activeSlideIndex.value - 1
}

function nextSlide(): void {
  if (mediaList.value.length <= 1) return
  activeSlideIndex.value =
    activeSlideIndex.value === mediaList.value.length - 1 ? 0 : activeSlideIndex.value + 1
}

function removeSlide(index: number): void {
  const item = mediaList.value[index]
  if (item && item.url.startsWith('blob:')) {
    URL.revokeObjectURL(item.url)
  }
  mediaList.value.splice(index, 1)
  if (activeSlideIndex.value >= mediaList.value.length) {
    activeSlideIndex.value = Math.max(0, mediaList.value.length - 1)
  }
}

function removeActiveSlide(): void {
  removeSlide(activeSlideIndex.value)
}

onUnmounted(() => {
  mediaList.value.forEach((item) => {
    if (item.url.startsWith('blob:')) {
      URL.revokeObjectURL(item.url)
    }
  })
})
</script>

<template>
  <div class="flex h-full flex-col rounded-xl border border-border/80 bg-card shadow-xs overflow-hidden">
    <!-- Header del Social Preview -->
    <header class="flex items-center justify-between border-b border-border/70 px-4 py-3.5 bg-card/60 shrink-0">
      <div class="flex items-center gap-2">
        <span class="inline-flex h-2 w-2 rounded-full bg-success animate-pulse"></span>
        <span class="text-xs font-semibold text-foreground">Social Preview en Vivo</span>
      </div>
      <div class="flex items-center gap-2">
        <button
          v-if="platformConfig.maxMediaFiles > 1"
          type="button"
          class="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-0.5 text-[11px] font-medium text-foreground hover:bg-muted transition-colors"
          @click="triggerFileInput"
        >
          <Plus class="h-3 w-3" />
          <span>Slide</span>
        </button>
        <span class="rounded-md bg-muted px-2.5 py-1 text-[11px] font-semibold text-foreground">
          {{ platformConfig.label }}
        </span>
      </div>
    </header>

    <!-- Contenedor Scrollable del Mockup -->
    <div class="flex-1 overflow-y-auto p-4 flex flex-col items-center">
      <!-- MOCKUPS TEMATIZADOS POR PLATAFORMA (SSOT) -->
      <div
        :class="[
          'mx-auto flex w-full max-w-sm flex-col overflow-hidden rounded-2xl shadow-xl transition-all duration-300',
          platformConfig.themeClass,
        ]"
      >
        <!-- ========================================== -->
        <!-- CASO 1: TIKTOK (theme-tiktok)              -->
        <!-- ========================================== -->
        <div
          v-if="platformKey === 'tiktok'"
          class="relative aspect-[9/16] w-full overflow-hidden bg-zinc-950 text-white select-none"
        >
          <!-- Media Background / Dropzone -->
          <div
            class="group absolute inset-0 flex items-center justify-center overflow-hidden"
            :class="isDragging ? 'border-2 border-dashed border-cyan-400 bg-cyan-950/40' : ''"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="handleDrop"
          >
            <template v-if="activeSlide">
              <video
                v-if="activeSlide.isVideo"
                :key="'tt-video-' + activeSlide.url"
                :src="activeSlide.url"
                autoplay
                loop
                muted
                playsinline
                class="h-full w-full object-cover"
              ></video>
              <img
                v-else
                :key="'tt-image-' + activeSlide.url"
                :src="activeSlide.url"
                :alt="activeSlide.name"
                class="h-full w-full object-cover"
              />
              <button
                type="button"
                class="absolute top-3 right-3 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-xs hover:scale-110"
                @click.stop="removeActiveSlide"
              >
                <X class="h-3.5 w-3.5" />
              </button>

              <!-- Flechas de navegación para modo foto / carrusel en TikTok -->
              <template v-if="mediaList.length > 1">
                <button
                  type="button"
                  class="absolute left-2 top-1/2 -translate-y-1/2 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-xs hover:scale-110"
                  @click.stop="prevSlide"
                >
                  <ChevronLeft class="h-4 w-4" />
                </button>
                <button
                  type="button"
                  class="absolute right-2 top-1/2 -translate-y-1/2 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-xs hover:scale-110"
                  @click.stop="nextSlide"
                >
                  <ChevronRight class="h-4 w-4" />
                </button>
              </template>
            </template>
            <template v-else>
              <div
                class="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-2 p-5 text-center bg-gradient-to-b from-zinc-900 to-black hover:bg-zinc-900"
                @click="triggerFileInput"
              >
                <div class="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400">
                  <Upload class="h-5 w-5" />
                </div>
                <span class="text-xs font-semibold text-zinc-200">Subí videos o fotos para TikTok</span>
                <span class="text-[10px] text-zinc-400">Soporta videos 9:16 o Carrusel de fotos</span>
              </div>
            </template>
          </div>

          <!-- Top Tabs / Badge Modo Foto -->
          <div class="absolute top-3 inset-x-0 z-10 flex items-center justify-between px-3 text-xs font-bold drop-shadow-md">
            <div v-if="mediaList.length > 1" class="flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-cyan-300 backdrop-blur-xs">
              <Camera class="h-3 w-3" />
              <span>Modo Foto • {{ activeSlideIndex + 1 }}/{{ mediaList.length }}</span>
            </div>
            <div v-else class="w-10"></div>

            <div class="flex items-center gap-3">
              <span class="text-white/70">Siguiendo</span>
              <span class="border-b-2 border-white pb-0.5 text-white">Para ti</span>
            </div>
            <div class="w-10"></div>
          </div>

          <!-- Rail Lateral Derecho de Interacciones TikTok -->
          <div class="absolute right-2 bottom-16 z-10 flex flex-col items-center gap-3.5 text-center drop-shadow-lg">
            <!-- Avatar con botón Follow -->
            <div class="relative mb-1">
              <div class="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-cyan-500 to-pink-500 text-xs font-bold text-white ring-2 ring-white">
                JL
              </div>
              <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 flex h-4 w-4 items-center justify-center rounded-full bg-pink-500 text-[10px] font-bold text-white">
                +
              </div>
            </div>

            <!-- Like -->
            <button type="button" class="flex flex-col items-center gap-0.5" @click="liked = !liked">
              <Heart :class="['h-7 w-7 transition-transform active:scale-125', liked ? 'fill-pink-500 text-pink-500' : 'text-white']" />
              <span class="text-[10px] font-bold">{{ liked ? '45.2K' : '45.1K' }}</span>
            </button>

            <!-- Comentarios -->
            <div class="flex flex-col items-center gap-0.5">
              <MessageCircle class="h-7 w-7 fill-white/10 text-white" />
              <span class="text-[10px] font-bold">528</span>
            </div>

            <!-- Favorito -->
            <button type="button" class="flex flex-col items-center gap-0.5" @click="saved = !saved">
              <Bookmark :class="['h-7 w-7 transition-transform active:scale-125', saved ? 'fill-amber-400 text-amber-400' : 'text-white']" />
              <span class="text-[10px] font-bold">2.3K</span>
            </button>

            <!-- Compartir -->
            <div class="flex flex-col items-center gap-0.5">
              <Share2 class="h-7 w-7 text-white" />
              <span class="text-[10px] font-bold">894</span>
            </div>

            <!-- Vinilo Giratorio de Música -->
            <div class="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 ring-2 ring-zinc-700 animate-spin">
              <Disc3 class="h-5 w-5 text-zinc-400" />
            </div>
          </div>

          <!-- Overlay Inferior con Descripción y Hook -->
          <div class="absolute bottom-2 left-3 right-14 z-10 flex flex-col gap-1.5 drop-shadow-md">
            <!-- Hook Sticker si está presente -->
            <div
              v-if="sections.hook"
              class="self-start rounded-md bg-black/75 px-2.5 py-1 text-xs font-black tracking-wide text-cyan-300 backdrop-blur-xs border border-cyan-400/30"
            >
              ⚓ {{ sections.hook }}
            </div>

            <!-- Nombre de usuario -->
            <span class="text-xs font-bold text-white">@jlmasajistas</span>

            <!-- Caption -->
            <p class="line-clamp-2 text-xs leading-snug text-white/95">
              {{ sections.caption || 'Tu descripción de TikTok se mostrará aquí...' }}
            </p>

            <!-- CTA & Hashtags -->
            <div v-if="sections.cta" class="text-[11px] font-semibold text-cyan-300">
              👉 {{ sections.cta }}
            </div>
            <div v-if="sections.hashtags?.length" class="flex flex-wrap gap-1">
              <span v-for="tag in sections.hashtags" :key="tag" class="text-[10px] font-bold text-cyan-400">
                {{ tag }}
              </span>
            </div>

            <!-- Ticker de Audio -->
            <div class="mt-0.5 flex items-center gap-1.5 text-[10px] text-white/80">
              <Music class="h-3 w-3 animate-pulse" />
              <span class="truncate">sonido original - JL Masajistas • Rosario</span>
            </div>
          </div>
        </div>

        <!-- ========================================== -->
        <!-- CASO 2: YOUTUBE SHORTS (theme-yt)          -->
        <!-- ========================================== -->
        <div
          v-else-if="platformKey === 'yt_short'"
          class="relative aspect-[9/16] w-full overflow-hidden bg-zinc-950 text-white select-none"
        >
          <!-- Media Area -->
          <div
            class="group absolute inset-0 flex items-center justify-center overflow-hidden"
            :class="isDragging ? 'border-2 border-dashed border-red-500 bg-red-950/40' : ''"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="handleDrop"
          >
            <template v-if="activeSlide">
              <video
                v-if="activeSlide.isVideo"
                :key="'yt-video-' + activeSlide.url"
                :src="activeSlide.url"
                autoplay
                loop
                muted
                playsinline
                class="h-full w-full object-cover"
              ></video>
              <img
                v-else
                :key="'yt-image-' + activeSlide.url"
                :src="activeSlide.url"
                :alt="activeSlide.name"
                class="h-full w-full object-cover"
              />
              <button
                type="button"
                class="absolute top-3 right-3 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-xs hover:scale-110"
                @click.stop="removeActiveSlide"
              >
                <X class="h-3.5 w-3.5" />
              </button>
            </template>
            <template v-else>
              <div
                class="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-2 p-5 text-center bg-gradient-to-b from-zinc-900 to-black hover:bg-zinc-900"
                @click="triggerFileInput"
              >
                <div class="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/20 text-red-500">
                  <Upload class="h-5 w-5" />
                </div>
                <span class="text-xs font-semibold text-zinc-200">Subí tu YouTube Short</span>
                <span class="text-[10px] text-zinc-400">Formato 9:16 vertical</span>
              </div>
            </template>
          </div>

          <!-- Top YouTube Short Badge -->
          <div class="absolute top-3 left-3 z-10 flex items-center gap-1.5 drop-shadow-md">
            <span class="rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-black uppercase text-white tracking-wider">
              Shorts
            </span>
          </div>

          <!-- Rail Lateral Derecho YouTube -->
          <div class="absolute right-2 bottom-12 z-10 flex flex-col items-center gap-4 text-center drop-shadow-lg">
            <!-- Like -->
            <button type="button" class="flex flex-col items-center gap-0.5" @click="liked = !liked">
              <ThumbsUp :class="['h-6 w-6 transition-transform active:scale-125', liked ? 'fill-white text-white' : 'text-white']" />
              <span class="text-[10px] font-semibold">{{ liked ? '1.8K' : '1.7K' }}</span>
            </button>

            <!-- Dislike -->
            <div class="flex flex-col items-center gap-0.5">
              <ThumbsDown class="h-6 w-6 text-white" />
              <span class="text-[10px] font-semibold">No me gusta</span>
            </div>

            <!-- Comentarios -->
            <div class="flex flex-col items-center gap-0.5">
              <MessageCircle class="h-6 w-6 text-white" />
              <span class="text-[10px] font-semibold">142</span>
            </div>

            <!-- Compartir -->
            <div class="flex flex-col items-center gap-0.5">
              <Share2 class="h-6 w-6 text-white" />
              <span class="text-[10px] font-semibold">Compartir</span>
            </div>

            <!-- Remix -->
            <div class="flex flex-col items-center gap-0.5">
              <Repeat class="h-6 w-6 text-white" />
              <span class="text-[10px] font-semibold">Remix</span>
            </div>
          </div>

          <!-- Overlay Inferior YouTube -->
          <div class="absolute bottom-3 left-3 right-16 z-10 flex flex-col gap-2 drop-shadow-md">
            <!-- Hook Sticker -->
            <div
              v-if="sections.hook"
              class="self-start rounded bg-red-600 px-2 py-0.5 text-xs font-bold text-white shadow-md"
            >
              {{ sections.hook }}
            </div>

            <!-- Canal y Botón Suscribirse -->
            <div class="flex items-center gap-2">
              <div class="flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
                JL
              </div>
              <span class="text-xs font-semibold text-white">@jlmasajistas</span>
              <button type="button" class="rounded-full bg-white px-2.5 py-0.5 text-[10px] font-bold text-black hover:bg-zinc-200">
                Suscribirse
              </button>
            </div>

            <!-- Título/Headline del Video si la plataforma lo soporta -->
            <h4 v-if="platformConfig.hasTitle && headline" class="text-xs font-bold text-white line-clamp-1">
              {{ headline }}
            </h4>

            <!-- Descripción / Título del Short -->
            <p class="line-clamp-2 text-xs leading-snug text-white/95">
              {{ sections.caption || 'Descripción del Short...' }}
            </p>

            <div v-if="sections.cta" class="text-[11px] font-medium text-red-300">
              👉 {{ sections.cta }}
            </div>
          </div>
        </div>

        <!-- ========================================== -->
        <!-- CASO 3: WHATSAPP / HISTORIA (theme-whatsapp) -->
        <!-- ========================================== -->
        <div
          v-else-if="platformKey === 'whatsapp'"
          class="relative aspect-[9/16] w-full overflow-hidden bg-zinc-900 text-white select-none"
        >
          <!-- Media Area -->
          <div
            class="group absolute inset-0 flex items-center justify-center overflow-hidden"
            :class="isDragging ? 'border-2 border-dashed border-emerald-500 bg-emerald-950/40' : ''"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="handleDrop"
          >
            <template v-if="activeSlide">
              <img
                :key="'wa-image-' + activeSlide.url"
                :src="activeSlide.url"
                :alt="activeSlide.name"
                class="h-full w-full object-cover"
              />
              <button
                type="button"
                class="absolute top-10 right-3 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:scale-110"
                @click.stop="removeActiveSlide"
              >
                <X class="h-3.5 w-3.5" />
              </button>

              <!-- Navegación de historias si hay múltiples fotos -->
              <template v-if="mediaList.length > 1">
                <button
                  type="button"
                  class="absolute left-2 top-1/2 -translate-y-1/2 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-xs hover:scale-110"
                  @click.stop="prevSlide"
                >
                  <ChevronLeft class="h-4 w-4" />
                </button>
                <button
                  type="button"
                  class="absolute right-2 top-1/2 -translate-y-1/2 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-xs hover:scale-110"
                  @click.stop="nextSlide"
                >
                  <ChevronRight class="h-4 w-4" />
                </button>
              </template>
            </template>
            <template v-else>
              <div
                class="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-2 p-5 text-center bg-gradient-to-b from-[#075E54] to-black hover:bg-[#075E54]/80"
                @click="triggerFileInput"
              >
                <div class="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white">
                  <Upload class="h-5 w-5" />
                </div>
                <span class="text-xs font-semibold text-white">Subí imágenes para Estado</span>
                <span class="text-[10px] text-white/80">WhatsApp / Historias (9:16)</span>
              </div>
            </template>
          </div>

          <!-- Barra de Progreso Superior Multi-Segmento -->
          <div class="absolute top-2 inset-x-2 z-20 flex gap-1">
            <div
              v-for="(_, idx) in Math.max(1, mediaList.length)"
              :key="idx"
              :class="[
                'h-0.5 flex-1 rounded transition-colors',
                idx <= activeSlideIndex ? 'bg-white' : 'bg-white/30',
              ]"
            ></div>
          </div>

          <!-- Top Header WhatsApp -->
          <div class="absolute top-4 inset-x-2 z-20 flex items-center justify-between text-white drop-shadow-md">
            <div class="flex items-center gap-2">
              <ArrowLeft class="h-4 w-4" />
              <div class="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold">
                JL
              </div>
              <div class="flex flex-col leading-tight">
                <span class="text-xs font-semibold">JL Masajistas</span>
                <span class="text-[9px] text-white/80">Hoy, 18:30</span>
              </div>
            </div>
            <MoreVertical class="h-4 w-4" />
          </div>

          <!-- Hook Flotante al Centro -->
          <div
            v-if="sections.hook"
            class="absolute top-1/3 inset-x-4 z-10 rounded-xl bg-black/80 p-3 text-center backdrop-blur-sm border border-white/20 shadow-lg"
          >
            <p class="text-xs font-extrabold text-emerald-400">
              {{ sections.hook }}
            </p>
          </div>

          <!-- Bottom Caption & Input de Respuesta WhatsApp -->
          <div class="absolute bottom-3 inset-x-3 z-20 flex flex-col gap-2">
            <div
              v-if="sections.caption || sections.cta"
              class="rounded-lg bg-black/70 p-2.5 text-center text-xs leading-snug backdrop-blur-xs text-white"
            >
              <p>{{ sections.caption }}</p>
              <p v-if="sections.cta" class="mt-1 font-bold text-emerald-400">
                👉 {{ sections.cta }}
              </p>
            </div>

            <!-- Barra Responder -->
            <div class="flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 backdrop-blur-md border border-white/20">
              <span class="flex-1 text-xs text-white/70">Responder...</span>
              <Smile class="h-4 w-4 text-white/70" />
            </div>
          </div>
        </div>

        <!-- ========================================== -->
        <!-- CASO 4: LINKEDIN DOCUMENT/CAROUSEL         -->
        <!-- ========================================== -->
        <div
          v-else-if="platformKey === 'linkedin'"
          class="flex flex-col rounded-2xl border border-border bg-card text-foreground select-none"
        >
          <!-- Top Profile Header LinkedIn -->
          <div class="flex items-center justify-between p-3 border-b border-border/40">
            <div class="flex items-center gap-2.5">
              <div class="flex h-9 w-9 items-center justify-center rounded-md bg-[#0a66c2] text-xs font-bold text-white shadow-xs">
                JL
              </div>
              <div class="flex flex-col leading-tight">
                <span class="text-xs font-bold text-foreground">JL Masajistas • Rosario</span>
                <span class="text-[10px] text-muted-foreground">Kinesiología & Masajes Terapéuticos</span>
                <span class="text-[9px] text-muted-foreground">1 d • 🌐</span>
              </div>
            </div>
            <MoreHorizontal class="h-4 w-4 text-muted-foreground" />
          </div>

          <!-- Post Body / Hook & Caption -->
          <div class="p-3 text-xs leading-relaxed text-foreground flex flex-col gap-2">
            <!-- Título/Headline corporativo si está presente -->
            <h4 v-if="platformConfig.hasTitle && headline" class="font-bold text-foreground text-sm">
              {{ headline }}
            </h4>
            <p v-if="sections.hook" class="font-bold text-[#0a66c2]">
              {{ sections.hook }}
            </p>
            <p class="whitespace-pre-line text-foreground/90">
              {{ sections.caption || 'El contenido profesional para LinkedIn aparecerá aquí...' }}
            </p>
            <p v-if="sections.cta" class="font-semibold text-[#0a66c2]">
              👉 {{ sections.cta }}
            </p>
            <div v-if="sections.hashtags?.length" class="flex flex-wrap gap-1">
              <span v-for="tag in sections.hashtags" :key="tag" class="text-[11px] font-semibold text-[#0a66c2] hover:underline">
                {{ tag }}
              </span>
            </div>
          </div>

          <!-- Visor de Documento / Carrusel Estilo LinkedIn -->
          <div class="flex flex-col border-y border-border/60 bg-muted/20">
            <!-- Barra Superior del Documento PDF / Carrusel -->
            <div class="flex items-center justify-between bg-muted/80 px-3 py-1.5 text-[11px] text-muted-foreground">
              <div class="flex items-center gap-1.5 truncate">
                <FileText class="h-3.5 w-3.5 text-[#0a66c2] shrink-0" />
                <span class="truncate font-medium text-foreground">
                  {{ headline ? `${headline.slice(0, 30)}.pdf` : 'Presentación_JLMasajistas.pdf' }}
                </span>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <span class="font-semibold text-foreground">
                  Pág. {{ activeSlideIndex + 1 }} de {{ Math.max(1, mediaList.length) }}
                </span>
                <Maximize2 class="h-3 w-3 cursor-pointer hover:text-foreground" />
              </div>
            </div>

            <!-- Área de Visualización del Slide -->
            <div
              class="group relative aspect-square w-full overflow-hidden bg-zinc-950/5 flex items-center justify-center"
              :class="isDragging ? 'border-2 border-dashed border-[#0a66c2] bg-[#0a66c2]/10' : ''"
              @dragover.prevent="isDragging = true"
              @dragleave.prevent="isDragging = false"
              @drop.prevent="handleDrop"
            >
              <template v-if="activeSlide">
                <img :key="'in-image-' + activeSlide.url" :src="activeSlide.url" :alt="activeSlide.name" class="h-full w-full object-cover" />
                <button
                  type="button"
                  class="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:scale-110"
                  @click.stop="removeActiveSlide"
                >
                  <X class="h-3.5 w-3.5" />
                </button>

                <!-- Flechas de Navegación del Documento -->
                <template v-if="mediaList.length > 1">
                  <button
                    type="button"
                    class="absolute left-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-xs hover:scale-110"
                    @click.stop="prevSlide"
                  >
                    <ChevronLeft class="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    class="absolute right-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-xs hover:scale-110"
                    @click.stop="nextSlide"
                  >
                    <ChevronRight class="h-4 w-4" />
                  </button>
                </template>
              </template>
              <template v-else>
                <div
                  class="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-1.5 p-4 text-center hover:bg-muted/60"
                  @click="triggerFileInput"
                >
                  <Upload class="h-6 w-6 text-[#0a66c2]" />
                  <span class="text-xs font-semibold text-foreground">Subí slides o imágenes para LinkedIn</span>
                  <span class="text-[10px] text-muted-foreground">Formato Carrusel de Documento (1:1 o 4:5)</span>
                </div>
              </template>
            </div>

            <!-- Barra de Progreso Inferior del Documento LinkedIn -->
            <div class="h-1 w-full bg-muted/60 overflow-hidden">
              <div
                class="h-full bg-[#0a66c2] transition-all duration-300"
                :style="{ width: `${((activeSlideIndex + 1) / Math.max(1, mediaList.length)) * 100}%` }"
              ></div>
            </div>
          </div>

          <!-- LinkedIn Actions Footer -->
          <div class="flex items-center justify-around border-t border-border/50 py-2 text-muted-foreground text-xs font-medium">
            <button type="button" class="flex items-center gap-1 hover:text-foreground" @click="liked = !liked">
              <ThumbsUp :class="['h-4 w-4', liked ? 'text-[#0a66c2] fill-[#0a66c2]' : '']" />
              <span>Recomendar</span>
            </button>
            <button type="button" class="flex items-center gap-1 hover:text-foreground">
              <MessageCircle class="h-4 w-4" />
              <span>Comentar</span>
            </button>
            <button type="button" class="flex items-center gap-1 hover:text-foreground">
              <Repeat class="h-4 w-4" />
              <span>Compartir</span>
            </button>
            <button type="button" class="flex items-center gap-1 hover:text-foreground">
              <Send class="h-4 w-4" />
              <span>Enviar</span>
            </button>
          </div>
        </div>

        <!-- ========================================== -->
        <!-- CASO 5: INSTAGRAM CAROUSEL / REEL (DEFAULT)-->
        <!-- ========================================== -->
        <div
          v-else
          class="flex w-full flex-col overflow-hidden rounded-2xl border border-border/90 bg-background shadow-md"
        >
          <!-- Top Bar del Mockup (Perfil Instagram) -->
          <div class="flex items-center justify-between border-b border-border/40 px-3.5 py-2.5 bg-card/60">
            <div class="flex items-center gap-2">
              <div class="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 to-pink-500 text-[11px] font-bold text-white shadow-xs">
                JL
              </div>
              <div class="flex flex-col leading-tight">
                <div class="flex items-center gap-1">
                  <span class="text-xs font-semibold text-foreground">jlmasajistas</span>
                  <CheckCircle2 class="h-3 w-3 text-primary fill-primary text-background" />
                </div>
                <span class="text-[10px] text-muted-foreground">Rosario, Santa Fe</span>
              </div>
            </div>
            <MoreHorizontal class="h-4 w-4 text-muted-foreground" />
          </div>

          <!-- Área de Multimedia / Carrusel / Dropzone -->
          <div
            :class="[
              'group relative flex w-full items-center justify-center overflow-hidden bg-muted/40 transition-colors',
              platformKey === 'ig_reel' ? 'aspect-[9/16]' : 'aspect-square',
              isDragging ? 'border-2 border-dashed border-primary bg-primary/10' : '',
            ]"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="handleDrop"
          >
            <template v-if="activeSlide">
              <video
                v-if="activeSlide.isVideo"
                :key="'ig-video-' + activeSlide.url"
                :src="activeSlide.url"
                autoplay
                loop
                muted
                playsinline
                class="h-full w-full object-cover"
              ></video>
              <img
                v-else
                :key="'ig-image-' + activeSlide.url"
                :src="activeSlide.url"
                :alt="activeSlide.name"
                class="h-full w-full object-cover"
              />

              <!-- Botón Eliminar Slide Actual -->
              <button
                type="button"
                title="Remover este slide"
                class="absolute top-2.5 right-2.5 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-xs transition-transform hover:scale-110 active:scale-95"
                @click.stop="removeActiveSlide"
              >
                <X class="h-3.5 w-3.5" />
              </button>

              <!-- Contador de Slides (Carrusel Instagram) -->
              <div
                v-if="mediaList.length > 1"
                class="absolute top-2.5 left-2.5 z-10 rounded-full bg-black/65 px-2.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-xs tracking-wide shadow-xs"
              >
                {{ activeSlideIndex + 1 }}/{{ mediaList.length }}
              </div>

              <!-- Flechas de Navegación del Carrusel -->
              <template v-if="mediaList.length > 1">
                <button
                  type="button"
                  class="absolute left-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-xs transition-transform hover:scale-110 hover:bg-black/80"
                  @click.stop="prevSlide"
                >
                  <ChevronLeft class="h-4 w-4" />
                </button>
                <button
                  type="button"
                  class="absolute right-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-xs transition-transform hover:scale-110 hover:bg-black/80"
                  @click.stop="nextSlide"
                >
                  <ChevronRight class="h-4 w-4" />
                </button>
              </template>

              <!-- Paginador de Puntos Instagram (Dots) -->
              <div
                v-if="mediaList.length > 1"
                class="absolute bottom-3 z-10 flex items-center justify-center gap-1.5 inset-x-0"
              >
                <span
                  v-for="(_, idx) in mediaList"
                  :key="idx"
                  :class="[
                    'rounded-full transition-all duration-200 cursor-pointer',
                    idx === activeSlideIndex ? 'h-1.5 w-3.5 bg-primary shadow-xs' : 'h-1.5 w-1.5 bg-white/70 hover:bg-white',
                  ]"
                  @click.stop="activeSlideIndex = idx"
                />
              </div>
            </template>

            <!-- Dropzone por defecto -->
            <template v-else>
              <div
                class="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-2 p-5 text-center transition-all hover:bg-muted/60"
                @click="triggerFileInput"
              >
                <div class="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Upload class="h-5 w-5" />
                </div>
                <div class="flex flex-col gap-0.5">
                  <span class="text-xs font-semibold text-foreground">Soltá imágenes o videos</span>
                  <span class="text-[10px] text-muted-foreground">
                    {{ platformConfig.maxMediaFiles > 1 ? `Soporta hasta ${platformConfig.maxMediaFiles} slides para Carrusel` : 'Formato optimizado para ' + platformConfig.label }}
                  </span>
                </div>
              </div>
            </template>

            <!-- Overlay Dinámico del Hook (Sticker en pantalla) -->
            <div
              v-if="sections.hook && !mediaList.length"
              class="pointer-events-none absolute bottom-2.5 inset-x-2.5 z-10 rounded-lg bg-black/75 p-2 text-center backdrop-blur-xs"
            >
              <p class="text-xs font-bold leading-snug text-white shadow-xs">
                {{ sections.hook }}
              </p>
            </div>
          </div>

          <!-- Barra de Acciones de Red Social -->
          <div class="flex items-center justify-between px-3.5 py-2">
            <div class="flex items-center gap-3">
              <button type="button" class="transition-transform active:scale-125" @click="liked = !liked">
                <Heart :class="['h-5 w-5', liked ? 'fill-destructive text-destructive' : 'text-foreground']" />
              </button>
              <button type="button">
                <MessageCircle class="h-5 w-5 text-foreground" />
              </button>
              <button type="button">
                <Send class="h-5 w-5 text-foreground" />
              </button>
            </div>
            <button type="button" class="transition-transform active:scale-125" @click="saved = !saved">
              <Bookmark :class="['h-5 w-5', saved ? 'fill-foreground text-foreground' : 'text-foreground']" />
            </button>
          </div>

          <!-- Contador de Likes y Caption Instagram -->
          <div class="flex flex-col gap-1 px-3.5 pb-3">
            <span class="text-[11px] font-semibold text-foreground">
              {{ liked ? '343 Me gusta' : '342 Me gusta' }}
            </span>

            <!-- Caption Dinámico en Tiempo Real -->
            <div class="text-xs leading-relaxed text-foreground/90">
              <span class="font-semibold text-foreground">jlmasajistas </span>
              <span class="whitespace-pre-line">{{ sections.caption || 'Tu descripción en vivo aparecerá acá a medida que escribas...' }}</span>
            </div>

            <!-- CTA Renderizado -->
            <div v-if="sections.cta" class="mt-1 text-[11px] font-medium text-primary">
              👉 {{ sections.cta }}
            </div>

            <!-- Hashtags Renderizados en Vivo -->
            <div v-if="sections.hashtags && sections.hashtags.length > 0" class="mt-1 flex flex-wrap gap-1">
              <span
                v-for="tag in sections.hashtags"
                :key="tag"
                class="text-[11px] font-medium text-primary hover:underline cursor-pointer"
              >
                {{ tag }}
              </span>
            </div>

            <!-- Audio Indicator para Reels -->
            <div v-if="platformKey === 'ig_reel'" class="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
              <Music class="h-3 w-3 animate-bounce" />
              <span>Audio original - JL Masajistas • Rosario</span>
            </div>
          </div>
        </div>
      </div>

      <!-- BANDEJA DE MINIATURAS DEL CARRUSEL (THUMBNAIL TRAY) -->
      <div
        v-if="platformConfig.maxMediaFiles > 1 && mediaList.length > 0"
        class="mt-4 flex w-full max-w-sm flex-col gap-2 rounded-xl border border-border/80 bg-card/90 p-3 shadow-xs"
      >
        <div class="flex items-center justify-between text-xs font-semibold text-foreground">
          <div class="flex items-center gap-1.5">
            <Layers class="h-3.5 w-3.5 text-primary" />
            <span>Slides del Carrusel ({{ mediaList.length }}/{{ platformConfig.maxMediaFiles }})</span>
          </div>
          <span class="text-[10px] font-normal text-muted-foreground">
            Slide {{ activeSlideIndex + 1 }} activo
          </span>
        </div>

        <div class="flex items-center gap-2 overflow-x-auto py-1">
          <!-- Thumbnail Cards -->
          <div
            v-for="(item, idx) in mediaList"
            :key="'tray-slide-' + idx"
            :class="[
              'group relative h-14 w-14 shrink-0 cursor-pointer overflow-hidden rounded-lg border-2 transition-all',
              idx === activeSlideIndex
                ? 'border-primary ring-2 ring-primary/30 scale-105'
                : 'border-border/70 hover:border-foreground/50 opacity-75 hover:opacity-100',
            ]"
            @click="selectSlide(idx)"
          >
            <video v-if="item.isVideo" :src="item.url" class="h-full w-full object-cover" />
            <img v-else :src="item.url" :alt="item.name" class="h-full w-full object-cover" />

            <!-- Slide Badge Number -->
            <span class="absolute bottom-0.5 left-0.5 rounded bg-black/75 px-1 text-[9px] font-bold text-white">
              {{ idx + 1 }}
            </span>

            <!-- Remove Button on Thumbnail Hover -->
            <button
              type="button"
              class="absolute top-0.5 right-0.5 hidden h-4 w-4 items-center justify-center rounded-full bg-destructive text-white group-hover:flex hover:scale-110 shadow-xs"
              title="Eliminar slide"
              @click.stop="removeSlide(idx)"
            >
              <X class="h-2.5 w-2.5" />
            </button>
          </div>

          <!-- Add More Slides Button -->
          <button
            v-if="mediaList.length < platformConfig.maxMediaFiles"
            type="button"
            class="flex h-14 w-14 shrink-0 flex-col items-center justify-center gap-0.5 rounded-lg border-2 border-dashed border-border/80 bg-muted/20 text-muted-foreground transition-colors hover:border-primary hover:bg-primary/5 hover:text-primary"
            title="Agregar nuevo slide al carrusel"
            @click="triggerFileInput"
          >
            <Plus class="h-4 w-4" />
            <span class="text-[9px] font-medium">+ Slide</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Hidden Input para subida de archivos múltiples -->
    <input
      ref="fileInputRef"
      type="file"
      accept="image/*,video/*"
      multiple
      class="hidden"
      @change="handleFileUpload"
    />
  </div>
</template>
