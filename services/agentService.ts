import type { CopySections } from '~~/entities/news/types'

/**
 * ASDD Agent Service Layer
 * Encapsulates backend agent endpoints and lifecycle interactions.
 */

export interface GenerateCopyOptions {
  headline?: string
  contentIdea?: string
  sourceUrl?: string
}

export interface GenerateCopyResponse {
  success: boolean
  data: {
    ideaId?: string
    platform: string
    formattedCopy: string
    sections: CopySections
  }
  model: string
  executedAt: string
}

export const agentService = {
  /**
   * Coppy-Hook Agent: Generates high-impact social copy from an idea.
   * @param ideaId Document ID of the idea in Firestore
   * @param platform Target social media platform
   * @param extra Optional extra payload fields if available in memory
   */
  async generateCopy(
    ideaId: string,
    platform: string,
    extra?: GenerateCopyOptions
  ): Promise<GenerateCopyResponse> {
    return await $fetch<GenerateCopyResponse>('/api/agents/copyhook', {
      method: 'POST',
      body: {
        ideaId,
        platform,
        headline: extra?.headline,
        contentIdea: extra?.contentIdea,
        sourceUrl: extra?.sourceUrl,
      },
    })
  },
}
