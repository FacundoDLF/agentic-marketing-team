/**
 * Lead entity types.
 *
 * Represents qualified business leads scored by Agent 3.
 */
export interface Lead {
  id: string
  name: string
  company: string
  score: number
}
