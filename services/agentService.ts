/**
 * ASDD Agent Service Layer: Encapsulates backend agent endpoints.
 * Layer: services/agentService
 */
import type { CopySections } from '~~/entities/news/types'

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
  async generateCopy(
    ideaId: string,
    platform: string,
    extra?: GenerateCopyOptions,
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
