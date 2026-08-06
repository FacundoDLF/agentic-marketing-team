"use client"

import { useState } from "react"
import { Newspaper, FileText, Users, Bot, MessageSquare, Settings } from "lucide-react"
import { Sidebar, type TabId } from "@/components/sidebar"
import { Topbar } from "@/components/topbar"
import { DashboardView } from "@/components/dashboard-view"
import { PlaceholderView } from "@/components/placeholder-view"
import { FloatingOrchestrator } from "@/components/floating-orchestrator"

const meta: Record<TabId, { title: string }> = {
  dashboard: { title: "Dashboard" },
  scraper: { title: "Scraper — Agente 1" },
  borradores: { title: "Borradores — Agente 2" },
  leads: { title: "Leads — Agente 3" },
  orquestador: { title: "Orquestador — Agente 4" },
  inbox: { title: "Social Inbox — Agente 5" },
  settings: { title: "Settings" },
}

export default function Home() {
  const [active, setActive] = useState<TabId>("dashboard")

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar active={active} onSelect={setActive} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar title={meta[active].title} />

        <main className="flex-1 p-4 md:p-6">
          {active === "dashboard" && <DashboardView />}
          {active === "scraper" && (
            <PlaceholderView
              icon={Newspaper}
              title="Scraper (Agente 1)"
              description="Rastrea fuentes de noticias y detecta tendencias relevantes para tu marca automáticamente."
            />
          )}
          {active === "borradores" && (
            <PlaceholderView
              icon={FileText}
              title="Borradores (Agente 2)"
              description="Genera y edita copys para redes sociales, listos para tu revisión y aprobación."
            />
          )}
          {active === "leads" && (
            <PlaceholderView
              icon={Users}
              title="Leads (Agente 3)"
              description="Califica prospectos con un match score y prioriza a quién contactar primero."
            />
          )}
          {active === "orquestador" && (
            <PlaceholderView
              icon={Bot}
              title="Orquestador (Agente 4)"
              description="Coordina a todos los agentes desde un solo lugar mediante instrucciones en lenguaje natural."
            />
          )}
          {active === "inbox" && (
            <PlaceholderView
              icon={MessageSquare}
              title="Social Inbox (Agente 5)"
              description="Centraliza mensajes y comentarios de todas tus redes sociales en una sola bandeja."
            />
          )}
          {active === "settings" && (
            <PlaceholderView
              icon={Settings}
              title="Settings"
              description="Configura tu marca, integraciones y las reglas de aprobación de tu equipo de IA."
            />
          )}
        </main>
      </div>

      <FloatingOrchestrator />
    </div>
  )
}
