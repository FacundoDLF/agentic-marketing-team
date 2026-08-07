/**
 * News and Content Idea Schemas and Types.
 * Layer: entities/news
 */
import { z } from 'zod'

export type IdeaStatus =
  | 'pending'
  | 'pending_review'
  | 'approved'
  | 'copy_generating'
  | 'copy_ready'
  | 'rejected'
  | 'archived'

export interface CopySections {
  hook: string
  body: string
  caption: string
  hashtags: string[]
  cta: string
}

export const NewsIdeaSchema = z.object({
  id: z.string().uuid({ message: 'Must be a valid UUID' }),
  sourceUrl: z.string().url({ message: 'Must be a valid URL' }),
  headline: z.string().min(1, { message: 'Headline is required' }),
  contentIdea: z.string().min(1, { message: 'Content idea in markdown is required' }),
  platforms: z.array(z.string()).min(1, { message: 'At least one platform is required' }),
  publishedAt: z.string().optional(),
  status: z.string().default('pending_review'),
  copyFormatted: z.string().optional(),
  copySections: z
    .object({
      hook: z.string(),
      body: z.string(),
      caption: z.string(),
      hashtags: z.array(z.string()),
      cta: z.string(),
    })
    .optional(),
  copyPlatform: z.string().optional(),
  createdAt: z.union([z.string(), z.number(), z.date()]),
})

export type NewsIdea = z.infer<typeof NewsIdeaSchema>

export const NewsIdeasResponseSchema = z.array(NewsIdeaSchema)
export type NewsIdeasResponse = z.infer<typeof NewsIdeasResponseSchema>

export interface ExtractedNews {
  headline: string
  sourceUrl: string
  snippet: string
  publishedAt: string
}
