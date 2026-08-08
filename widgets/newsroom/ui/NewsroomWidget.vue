<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Loader2 } from '@lucide/vue'
import { useScraper } from '~~/features/ScraperNews'
import { agentService } from '~~/services/agentService'
import { AGENTS } from '~~/shared/constants'
import SocialPreview from './SocialPreview.vue'
import NewsroomWorkspace from './NewsroomWorkspace.vue'
import type { NewsIdea, CopySections } from '~~/entities/news/types'

const {
  fetchingIdeas,
  ideas,
  fetchIdeas,
  updateIdeaStatus,
  updateIdeaCopy,
} = useScraper()

const activeIdeaId = ref<string | null>(null)
const selectedPlatforms = ref<Record<string, string>>({})
const generatingCopy = ref<Record<string, boolean>>({})
const copyError = ref<Record<string, string>>({})
const liveSections = ref<Record<string, CopySections>>({})

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

// Auto-seleccionar la primera idea disponible si no hay ninguna seleccionada
watch(
  approvedIdeas,
  (list) => {
    const first = list[0]
    if (first) {
      if (!activeIdeaId.value || !list.some((i) => i.id === activeIdeaId.value)) {
        activeIdeaId.value = first.id
      }
    } else {
      activeIdeaId.value = null
    }
  },
  { immediate: true },
)

const activeIdea = computed<NewsIdea | null>(() => {
  if (!activeIdeaId.value) return null
  return approvedIdeas.value.find((i) => i.id === activeIdeaId.value) || null
})

const currentPlatform = computed<string>(() => {
  if (!activeIdea.value) return 'Instagram Reel'
  return (
    selectedPlatforms.value[activeIdea.value.id] ||
    activeIdea.value.platforms?.[0] ||
    'Instagram Reel'
  )
})

function handleSelectIdea(id: string): void {
  activeIdeaId.value = id
}

function handleChangePlatform(platform: string): void {
  if (activeIdea.value) {
    selectedPlatforms.value[activeIdea.value.id] = platform
  }
}

function handleArchive(id: string): void {
  updateIdeaStatus(id, 'archived')
}

function handleSectionsUpdate(sections: CopySections): void {
  if (activeIdea.value) {
    liveSections.value[activeIdea.value.id] = sections
  }
}

function getLiveSections(item: NewsIdea | null): CopySections {
  if (!item) {
    return {
      hook: '',
      body: '',
      caption: '',
      hashtags: ['#JLMasajistas', '#Rosario', '#Kinesiologia', '#Bienestar'],
      cta: '',
    }
  }
  const current = liveSections.value[item.id]
  if (current) {
    return current
  }
  if (item.copySections) {
    return item.copySections
  }
  return {
    hook: '',
    body: item.contentIdea || '',
    caption: '',
    hashtags: ['#JLMasajistas', '#Rosario', '#Kinesiologia', '#Bienestar'],
    cta: '',
  }
}

function handleCopyApproved(ideaId: string): void {
  updateIdeaStatus(ideaId, 'copy_ready')
}

async function handleGenerateCopy(platform: string): Promise<void> {
  const item = activeIdea.value
  if (!item) return

  generatingCopy.value[item.id] = true
  copyError.value[item.id] = ''

  try {
    const res = await agentService.generateCopy(item.id, platform, {
      headline: item.headline,
      contentIdea: item.contentIdea,
      sourceUrl: item.sourceUrl,
    })

    if (res.success && res.data?.sections) {
      liveSections.value[item.id] = { ...res.data.sections }
      const tags = Array.isArray(res.data.sections.hashtags)
        ? res.data.sections.hashtags.join(' ')
        : ''
      const formatted =
        res.data.formattedCopy ||
        `### ⚓ Hook (3s)\n${res.data.sections.hook}\n\n### 📝 Cuerpo / Guión\n${res.data.sections.body}\n\n### 💬 Caption\n${res.data.sections.caption}\n\n### #️⃣ Hashtags\n${tags}\n\n### 🎯 CTA\n${res.data.sections.cta}`

      updateIdeaCopy(item.id, {
        copySections: res.data.sections,
        copyFormatted: formatted,
        copyPlatform: platform,
        status: 'copy_ready',
      })
    } else {
      throw new Error(res.error || 'No se pudo generar el copy.')
    }
  } catch (err: any) {
    console.error('Error generando copy:', err)
    copyError.value[item.id] =
      err?.data?.message ||
      err?.message ||
      `Error al generar copy con ${AGENTS.COPPY_HOOK.name}. Por favor reintentá.`
  } finally {
    generatingCopy.value[item.id] = false
  }
}
</script>

<template>
  <ClientOnly>
    <!-- Layout Principal: Social Preview en Vivo (Izquierda), Workspace + Inbox (Centro/Derecha) -->
    <div class="flex flex-col lg:flex-row gap-5 h-full w-full overflow-hidden">
      <!-- Columna Izquierda: Social Preview en Vivo (Panel Independiente) -->
      <div class="w-full lg:w-[380px] xl:w-[420px] shrink-0 h-full overflow-hidden">
        <SocialPreview
          :sections="getLiveSections(activeIdea)"
          :platform="currentPlatform"
          :headline="activeIdea?.headline"
        />
      </div>

      <!-- Columna Centro/Derecha: Workspace (CopyEditor + Inbox de Ideas) -->
      <div class="flex-1 min-w-0 h-full overflow-hidden">
        <NewsroomWorkspace
          :idea="activeIdea"
          :ideas="approvedIdeas"
          :active-idea-id="activeIdeaId"
          :fetching-ideas="fetchingIdeas"
          :platform="currentPlatform"
          :generating="Boolean(activeIdeaId && generatingCopy[activeIdeaId])"
          :error-msg="activeIdeaId ? copyError[activeIdeaId] : ''"
          :live-sections="getLiveSections(activeIdea)"
          @select-idea="handleSelectIdea"
          @refresh-ideas="fetchIdeas"
          @change-platform="handleChangePlatform"
          @generate-copy="handleGenerateCopy"
          @archive="handleArchive"
          @update-sections="handleSectionsUpdate"
          @approve="handleCopyApproved"
        />
      </div>
    </div>

    <!-- Fallback SSR -->
    <template #fallback>
      <div class="flex flex-col lg:flex-row gap-5 h-full w-full animate-pulse overflow-hidden">
        <div class="w-full lg:w-[380px] rounded-xl border border-border bg-card p-4 flex flex-col gap-3">
          <div class="h-8 w-32 rounded bg-muted"></div>
          <div class="h-96 w-full rounded-lg bg-muted/40"></div>
        </div>
        <div class="flex-1 rounded-xl border border-border bg-card p-6 flex flex-col gap-4">
          <div class="h-10 w-64 rounded bg-muted"></div>
          <div class="h-40 w-full rounded-lg bg-muted/30"></div>
        </div>
      </div>
    </template>
  </ClientOnly>
</template>
