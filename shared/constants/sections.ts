/**
 * ASDD Single Source of Truth: Section & Navigation Definitions
 * Layer: shared/constants/sections
 */
import { AGENTS } from './agents'

export const SECTIONS = {
  DASHBOARD: {
    id: 'dashboard',
    label: 'Dashboard',
    title: 'Dashboard',
    pageTitle: 'Dashboard',
    description: 'Panel principal y visión general del equipo autónomo de marketing.',
    route: '/',
    iconName: 'LayoutDashboard',
  },
  TENDENCIAS: {
    id: 'scraper',
    label: 'Tendencias',
    title: 'Radar de Tendencias',
    pageTitle: `Radar de Tendencias — ${AGENTS.SCRAPY.name}`,
    description:
      'Rastrea fuentes de noticias y detecta tendencias relevantes para tu marca automáticamente.',
    route: '/scraper',
    iconName: 'SatelliteDishIcon',
    agent: AGENTS.SCRAPY.name,
  },
  BORRADORES: {
    id: 'borradores',
    label: 'Newsroom',
    title: 'Últimos Copys Generados',
    pageTitle: `Newsroom — ${AGENTS.COPPY_HOOK.name}`,
    description: 'Genera y edita copys para redes sociales, listos para tu revisión y aprobación.',
    route: '/borradores',
    iconName: 'FileText',
    agent: AGENTS.COPPY_HOOK.name,
  },
  LEADS: {
    id: 'leads',
    label: 'Leads',
    title: 'Leads Calificados',
    pageTitle: 'Leads — Agente 3',
    description: 'Califica prospectos con un match score y prioriza a quién contactar primero.',
    route: '/leads',
    iconName: 'Users',
    agent: 'Agente 3',
  },
  ORQUESTADOR: {
    id: 'orquestador',
    label: 'Orquestador',
    title: 'Orquestador Chat',
    pageTitle: 'Orquestador — Agente 4',
    description:
      'Coordina a todos los agentes desde un solo lugar mediante instrucciones en lenguaje natural.',
    route: '/orquestador',
    iconName: 'Bot',
    agent: 'Agente 4',
  },
  INBOX: {
    id: 'inbox',
    label: 'Social Inbox',
    title: 'Social Inbox',
    pageTitle: 'Social Inbox — Agente 5',
    description:
      'Centraliza mensajes y comentarios de todas tus redes sociales en una sola bandeja.',
    route: '/inbox',
    iconName: 'MessageSquare',
    agent: 'Agente 5',
  },
  SETTINGS: {
    id: 'settings',
    label: 'Settings',
    title: 'Settings',
    pageTitle: 'Settings',
    description: 'Configura tu marca, integraciones y las reglas de aprobación de tu equipo de IA.',
    route: '/settings',
    iconName: 'Settings',
  },
} as const

export type SectionKey = keyof typeof SECTIONS
export type SectionInfo = (typeof SECTIONS)[SectionKey]
export type TabId = (typeof SECTIONS)[SectionKey]['id']
