import { z } from 'zod'

/**
 * Zod Schema for News Idea (Section 5 - Feature Spec Agente 1)
 * Firestore Collection: news_ideas
 */
export const NewsIdeaSchema = z.object({
  id: z.string().uuid({ message: 'Must be a valid UUID' }),
  sourceUrl: z.string().url({ message: 'Must be a valid URL' }),
  headline: z.string().min(1, { message: 'Headline is required' }),
  contentIdea: z.string().min(1, { message: 'Content idea in markdown is required' }),
  platforms: z.array(z.string()).min(1, { message: 'At least one platform is required' }),
  status: z.string().default('pending_review'),
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
