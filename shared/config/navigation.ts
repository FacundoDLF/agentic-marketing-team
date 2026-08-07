/**
 * Navigation configuration: connects SECTIONS to router and layout.
 * Layer: shared/config
 */
import { SECTIONS, type TabId, type SectionInfo } from '../constants/sections'

export type { TabId, SectionInfo }
export type NavEntry = SectionInfo

export const navItems: NavEntry[] = [
  SECTIONS.DASHBOARD,
  SECTIONS.TENDENCIAS,
  SECTIONS.BORRADORES,
  SECTIONS.LEADS,
  SECTIONS.ORQUESTADOR,
  SECTIONS.INBOX,
]

export const settingsEntry: NavEntry = SECTIONS.SETTINGS

export const tabMeta: Record<TabId, { title: string }> = {
  dashboard: { title: SECTIONS.DASHBOARD.pageTitle },
  scraper: { title: SECTIONS.TENDENCIAS.pageTitle },
  borradores: { title: SECTIONS.BORRADORES.pageTitle },
  leads: { title: SECTIONS.LEADS.pageTitle },
  orquestador: { title: SECTIONS.ORQUESTADOR.pageTitle },
  inbox: { title: SECTIONS.INBOX.pageTitle },
  settings: { title: SECTIONS.SETTINGS.pageTitle },
}

export function resolveTabId(path: string): TabId {
  const allEntries = [...navItems, settingsEntry]
  const match = allEntries.find((entry) => entry.route === path)
  return match?.id ?? 'dashboard'
}
