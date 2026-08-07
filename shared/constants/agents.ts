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
  LEADS: {
    id: 'leads-agent',
    name: 'Agente 3 (Leads)',
    role: 'Lead Qualification & CRM Manager',
    model: 'gemini-3.5-flash-lite',
  },
  ORCHESTRATOR: {
    id: 'orchestrator-agent',
    name: 'Agente 4 (Orquestador)',
    role: 'Workflow Manager & System Health',
    model: 'gemini-3.5-flash-lite',
  },
  SOCIAL_INBOX: {
    id: 'social-inbox-agent',
    name: 'Agente 5 (Social Inbox)',
    role: 'Community Manager & Sentiment Analyst',
    model: 'gemini-3.5-flash-lite',
  },
} as const

export type AgentKey = keyof typeof AGENTS
export type AgentInfo = (typeof AGENTS)[AgentKey]
