import { ref, computed } from 'vue'
import type { NewsIdea } from '../../../entities/news/types'

export type ScraperTimeframe = '1d' | '90d' | '180d' | 'next_15d' | 'next_30d'
export type IdeaStatus = 'pending_review' | 'approved' | 'rejected' | 'archived'

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

/**
 * Composable for managing Scrapy Agent (Agent 1) operations, quota, and idea statuses.
 * FSD Layer: features/ScraperNews/composables
 */
export function useScraper() {
  const loading = ref<boolean>(false)
  const fetchingIdeas = ref<boolean>(false)
  const error = ref<string | null>(null)
  const ideas = ref<NewsIdea[]>([])

  // Status message flags
  const toastBandejaLlena = ref<boolean>(false)
  const toastRssAgotado = ref<boolean>(false)
  const toastUrlDuplicada = ref<boolean>(false)

  /**
   * Fetches active ideas (pending_review + approved) from Firestore via GET /api/ideas
   */
  const fetchIdeas = async (): Promise<NewsIdea[]> => {
    fetchingIdeas.value = true
    error.value = null
    try {
      const response = await $fetch<{ success: boolean; data: NewsIdea[] }>('/api/ideas')
      ideas.value = response.data || []
      return ideas.value
    } catch (err: any) {
      console.warn('Error al cargar ideas de Firestore:', err)
      return []
    } finally {
      fetchingIdeas.value = false
    }
  }

  /**
   * Updates an idea status in Firestore and synchronizes local state:
   * - 'rejected': removes from view (frees quota)
   * - 'approved': stays in view with approved UI (frees quota for next scan)
   * - 'archived': removes from view (moves to history)
   */
  const updateIdeaStatus = async (id: string, newStatus: IdeaStatus): Promise<boolean> => {
    // Reset toast banners on user action
    toastBandejaLlena.value = false
    toastRssAgotado.value = false
    toastUrlDuplicada.value = false

    // Optimistic local update
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
      // Rollback
      await fetchIdeas()
      return false
    }
  }

  /**
   * Triggers manual or automated execution of the Scraper & Content Ideation agent.
   * Accepts either a timeframe string or an options object with manualUrl.
   */
  const triggerScraper = async (
    options: TriggerScraperOptions | ScraperTimeframe = '1d'
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
        // Merge fresh ideas at the beginning, avoiding duplicate IDs
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
        'Error al ejecutar Scrapy Agent (News Scraper)'
      error.value = errorMessage
      return null
    } finally {
      loading.value = false
    }
  }

  const pendingCount = computed(() =>
    ideas.value.filter((i) => i.status === 'pending_review').length
  )

  const approvedCount = computed(() =>
    ideas.value.filter((i) => i.status === 'approved').length
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
    triggerScraper,
  }
}
