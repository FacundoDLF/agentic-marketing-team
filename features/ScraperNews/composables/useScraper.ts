/**
 * Composable for managing Scrapy Agent operations, quota, and idea lifecycle with SSR-safe persistence.
 * Layer: features/ScraperNews/composables
 */
import { ref, computed } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import { AGENTS } from '../../../shared/constants/agents'
import type { NewsIdea, IdeaStatus, CopySections } from '../../../entities/news/types'

export type ScraperTimeframe = '1d' | '90d' | '180d' | 'next_15d' | 'next_30d'
export type { IdeaStatus }

export interface ScraperApiResponse {
  success: boolean
  count: number
  data: NewsIdea[]
  executedAt?: string
  message: string
}

export interface TriggerScraperOptions {
  timeframe?: ScraperTimeframe
  manualUrl?: string
}

const STORAGE_KEY = 'asdd_persisted_news_ideas'

const ideas = useLocalStorage<NewsIdea[]>(STORAGE_KEY, [])
const loading = ref<boolean>(false)
const fetchingIdeas = ref<boolean>(false)
const error = ref<string | null>(null)
const toastBandejaLlena = ref<boolean>(false)
const toastRssAgotado = ref<boolean>(false)
const toastUrlDuplicada = ref<boolean>(false)

export function useScraper() {
  const fetchIdeas = async (): Promise<NewsIdea[]> => {
    fetchingIdeas.value = true
    error.value = null
    try {
      const response = await $fetch<{ success: boolean; data: NewsIdea[] }>('/api/ideas')
      const remoteIdeas = response.data || []

      if (ideas.value.length === 0) {
        ideas.value = remoteIdeas
      } else {
        const localMap = new Map(ideas.value.map((i) => [i.id, i]))
        const merged: NewsIdea[] = remoteIdeas.map((remote) => {
          const local = localMap.get(remote.id)
          if (local) {
            return {
              ...remote,
              status: local.status || remote.status,
              copyFormatted: local.copyFormatted || remote.copyFormatted,
              copySections: local.copySections || remote.copySections,
              copyPlatform: local.copyPlatform || remote.copyPlatform,
            }
          }
          return remote
        })

        const remoteIds = new Set(remoteIdeas.map((r) => r.id))
        for (const local of ideas.value) {
          if (!remoteIds.has(local.id)) {
            merged.push(local)
          }
        }

        ideas.value = merged
      }
      return ideas.value
    } catch (err: any) {
      console.warn('Error al cargar ideas de Firestore:', err)
      return ideas.value
    } finally {
      fetchingIdeas.value = false
    }
  }

  const updateIdeaStatus = async (id: string, newStatus: IdeaStatus): Promise<boolean> => {
    toastBandejaLlena.value = false
    toastRssAgotado.value = false
    toastUrlDuplicada.value = false

    if (newStatus === 'rejected' || newStatus === 'archived') {
      ideas.value = ideas.value.filter((i) => i.id !== id)
    } else {
      const target = ideas.value.find((i) => i.id === id)
      if (target) {
        target.status = newStatus
      }
    }

    try {
      await $fetch(`/api/ideas/${id}`, {
        method: 'PATCH',
        body: { status: newStatus },
      })
      return true
    } catch (err: any) {
      console.error('Error al actualizar estado en Firestore:', err)
      return false
    }
  }

  const updateIdeaCopy = (
    id: string,
    copyData: {
      copyFormatted: string
      copySections: CopySections
      copyPlatform: string
      status?: IdeaStatus
    },
  ): void => {
    const target = ideas.value.find((i) => i.id === id)
    if (target) {
      target.copyFormatted = copyData.copyFormatted
      target.copySections = copyData.copySections
      target.copyPlatform = copyData.copyPlatform
      target.status = copyData.status || 'copy_ready'
    }
  }

  const triggerScraper = async (
    options: TriggerScraperOptions | ScraperTimeframe = '1d',
  ): Promise<NewsIdea[] | null> => {
    loading.value = true
    error.value = null
    toastBandejaLlena.value = false
    toastRssAgotado.value = false
    toastUrlDuplicada.value = false

    const payload: { timeframe?: ScraperTimeframe; manualUrl?: string } = {}
    if (typeof options === 'string') {
      payload.timeframe = options
    } else if (options && typeof options === 'object') {
      if (options.manualUrl) payload.manualUrl = options.manualUrl
      if (options.timeframe) payload.timeframe = options.timeframe
    }

    try {
      const response = await $fetch<ScraperApiResponse>('/api/agents/scraper', {
        method: 'POST',
        body: payload,
      })

      if (response.message === 'Bandeja_Llena') {
        toastBandejaLlena.value = true
        return []
      }

      if (response.message === 'URL_DUPLICADA') {
        toastUrlDuplicada.value = true
        return []
      }

      if (response.message === 'RSS_Agotado' || response.message === 'NO_NEW_ARTICLES') {
        toastRssAgotado.value = true
        return []
      }

      if (response.data && response.data.length > 0) {
        const existingIds = new Set(ideas.value.map((i) => i.id))
        const fresh = response.data.filter((i) => !existingIds.has(i.id))
        ideas.value = [...fresh, ...ideas.value]
      }

      return response.data
    } catch (err: any) {
      const errorMessage =
        err?.data?.message ||
        err?.data?.statusMessage ||
        err?.message ||
        `Error al ejecutar ${AGENTS.SCRAPY.name} (News Scraper)`
      error.value = errorMessage
      return null
    } finally {
      loading.value = false
    }
  }

  const pendingCount = computed(
    () =>
      ideas.value.filter(
        (i) => i.status === 'pending' || i.status === 'pending_review' || !i.status,
      ).length,
  )

  const approvedCount = computed(
    () =>
      ideas.value.filter(
        (i) =>
          i.status === 'approved' ||
          i.status === 'copy_ready' ||
          i.status === 'copy_generating',
      ).length,
  )

  return {
    loading,
    fetchingIdeas,
    error,
    ideas,
    pendingCount,
    approvedCount,
    toastBandejaLlena,
    toastRssAgotado,
    toastUrlDuplicada,
    fetchIdeas,
    updateIdeaStatus,
    updateIdeaCopy,
    triggerScraper,
  }
}
