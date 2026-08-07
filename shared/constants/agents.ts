/**
 * ASDD Single Source of Truth: Agent Definitions & Governance
 * Centralizes agent names, IDs, models, and metadata across backend, frontend, and tests.
 */

export const AGENTS = {
  SCRAPY: {
    id: 'scrapy-agent',
    name: 'Scrapy Agent',
    role: 'News Scraper & Content Ideation',
    model: 'gemini-3.5-flash-lite',
  },
  COPPY_HOOK: {
    id: 'coppy-hook-agent',
    name: 'Coppy-Hook Agent',
    role: 'Social Media Copywriter & Guionista',
    model: 'gemini-3.5-flash-lite',
  },
} as const

export type AgentKey = keyof typeof AGENTS
export type AgentInfo = (typeof AGENTS)[AgentKey]
