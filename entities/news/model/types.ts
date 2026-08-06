/**
 * News entity types.
 *
 * Represents market news gathered by Scraper (Agent 1).
 */
export type NewsStatus = 'pending' | 'approved' | 'discarded'

export interface NewsItem {
  id: string
  headline: string
  source: string
  time: string
  angle: string
}
