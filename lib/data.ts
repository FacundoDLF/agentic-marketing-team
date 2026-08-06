export type NewsItem = {
  id: string
  headline: string
  source: string
  time: string
  angle: string
}

export const pendingNews: NewsItem[] = [
  {
    id: "n1",
    headline: "La IA generativa impulsa un 40% más de conversión en campañas B2B",
    source: "TechCrunch",
    time: "hace 2 h",
    angle: "Tendencia de mercado",
  },
  {
    id: "n2",
    headline: "Nuevas reglas de privacidad cambian el email marketing en 2026",
    source: "Marketing Dive",
    time: "hace 4 h",
    angle: "Regulación",
  },
  {
    id: "n3",
    headline: "El video corto sigue liderando el engagement en redes sociales",
    source: "Social Media Today",
    time: "hace 6 h",
    angle: "Contenido",
  },
]

export type Lead = {
  id: string
  name: string
  company: string
  score: number
}

export const qualifiedLeads: Lead[] = [
  { id: "l1", name: "María González", company: "Nova Retail", score: 92 },
  { id: "l2", name: "Carlos Herrera", company: "Vela Logistics", score: 84 },
  { id: "l3", name: "Ana Ruiz", company: "Brightside Co.", score: 71 },
]

export type NavItem = {
  id: string
  label: string
  agent?: string
}
