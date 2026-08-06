import { ref } from 'vue'
import type { NewsIdea } from '../../../entities/news/types'

export interface ScraperApiResponse {
  success: boolean
  count: number
  data: NewsIdea[]
  executedAt: string
  message: string
}

/**
 * Composable for triggering and managing state of Agent 1 (ScraperNews).
 * FSD Layer: features/ScraperNews/composables
 */
export function useScraper() {
  const loading = ref<boolean>(false)
  const error = ref<string | null>(null)
  const data = ref<NewsIdea[] | null>(null)

  /**
   * Triggers manual or automated execution of the Scraper & Content Ideation agent.
   */
  const triggerScraper = async (): Promise<NewsIdea[] | null> => {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch<ScraperApiResponse>('/api/agents/scraper', {
        method: 'POST',
      })

      data.value = response.data
      return response.data
    } catch (err: any) {
      const errorMessage =
        err?.data?.statusMessage ||
        err?.message ||
        'Error al ejecutar el Agente 1 (News Scraper)'
      error.value = errorMessage
      return null
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    data,
    triggerScraper,
  }
}
