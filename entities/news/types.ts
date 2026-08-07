import { z } from 'zod'

/**
 * Idea Lifecycle States (ASDD Governance)
 */
export type IdeaStatus =
  | 'pending'
  | 'pending_review'
  | 'approved'
  | 'copy_generating'
  | 'copy_ready'
  | 'rejected'
  | 'archived'

/**
 * Structured Copy Sections from Coppy-Hook Agent
 */
export interface CopySections {
  hook: string
  body: string
  caption: string
  hashtags: string[]
  cta: string
}

/**
 * Zod Schema for News Idea
 * Firestore Collection: news_ideas
 */
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

/**
 * TypeScript Interface inferred from Zod Schema
 */
export type NewsIdea = z.infer<typeof NewsIdeaSchema>

/**
 * Array schema for batch ideas output
 */
export const NewsIdeasResponseSchema = z.array(NewsIdeaSchema)
export type NewsIdeasResponse = z.infer<typeof NewsIdeasResponseSchema>

/**
 * News item extracted from web sources (Pipeline Step 1)
 */
export interface ExtractedNews {
  headline: string
  sourceUrl: string
  snippet: string
  publishedAt: string
}

