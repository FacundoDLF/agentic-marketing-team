/**
 * Navigation configuration for the application.
 *
 * Centralizes tab IDs, nav items, and page metadata
 * used by the Sidebar, Topbar, and router.
 */

import { AGENTS } from '../constants/agents'

// ─── Types ──────────────────────────────────────────────────────────
export type TabId =
  | 'dashboard'
  | 'scraper'
  | 'borradores'
  | 'leads'
  | 'orquestador'
  | 'inbox'
  | 'settings'

export interface NavEntry {
  id: TabId
  label: string
  agent?: string
  /** Name of the lucide icon component (without the "Icon" suffix) */
  iconName: string
  /** Route path for vue-router */
  route: string
}

export interface TabMeta {
  title: string
}

// ─── Navigation Items ───────────────────────────────────────────────
export const navItems: NavEntry[] = [
  { id: 'dashboard', label: 'Dashboard', iconName: 'LayoutDashboard', route: '/' },
  { id: 'scraper', label: 'Tendencias', agent: AGENTS.SCRAPY.name, iconName: 'SatelliteDishIcon', route: '/scraper' },
  { id: 'borradores', label: 'Borradores', agent: AGENTS.COPPY_HOOK.name, iconName: 'FileText', route: '/borradores' },
  { id: 'leads', label: 'Leads', agent: 'Agente 3', iconName: 'Users', route: '/leads' },
  { id: 'orquestador', label: 'Orquestador', agent: 'Agente 4', iconName: 'Bot', route: '/orquestador' },
  { id: 'inbox', label: 'Social Inbox', agent: 'Agente 5', iconName: 'MessageSquare', route: '/inbox' },
]

// ─── Settings (separate from main nav) ──────────────────────────────
export const settingsEntry: NavEntry = {
  id: 'settings',
  label: 'Settings',
  iconName: 'Settings',
  route: '/settings',
}

// ─── Page Metadata ──────────────────────────────────────────────────
export const tabMeta: Record<TabId, TabMeta> = {
  dashboard: { title: 'Dashboard' },
  scraper: { title: `Radar de Tendencias — ${AGENTS.SCRAPY.name}` },
  borradores: { title: `Borradores — ${AGENTS.COPPY_HOOK.name}` },
  leads: { title: 'Leads — Agente 3' },
  orquestador: { title: 'Orquestador — Agente 4' },
  inbox: { title: 'Social Inbox — Agente 5' },
  settings: { title: 'Settings' },
}

/**
 * Resolves a route path to its corresponding TabId.
 * Falls back to 'dashboard' if no match is found.
 */
export function resolveTabId(path: string): TabId {
  const allEntries = [...navItems, settingsEntry]
  const match = allEntries.find((entry) => entry.route === path)
  return match?.id ?? 'dashboard'
}
