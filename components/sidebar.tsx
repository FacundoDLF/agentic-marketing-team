"use client"

import {
  LayoutDashboard,
  Newspaper,
  FileText,
  Users,
  Bot,
  MessageSquare,
  Settings,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"

export type TabId =
  | "dashboard"
  | "scraper"
  | "borradores"
  | "leads"
  | "orquestador"
  | "inbox"
  | "settings"

type NavEntry = {
  id: TabId
  label: string
  agent?: string
  icon: React.ComponentType<{ className?: string }>
}

const navItems: NavEntry[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "scraper", label: "Scraper", agent: "Agente 1", icon: Newspaper },
  { id: "borradores", label: "Borradores", agent: "Agente 2", icon: FileText },
  { id: "leads", label: "Leads", agent: "Agente 3", icon: Users },
  { id: "orquestador", label: "Orquestador", agent: "Agente 4", icon: Bot },
  { id: "inbox", label: "Social Inbox", agent: "Agente 5", icon: MessageSquare },
]

export function Sidebar({
  active,
  onSelect,
}: {
  active: TabId
  onSelect: (id: TabId) => void
}) {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
      <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold text-sidebar-foreground">
            Marketing AI
          </span>
          <span className="text-xs text-muted-foreground">Autonomous Team</span>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = active === item.id
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
              )}
            >
              <Icon className="h-4.5 w-4.5 shrink-0" />
              <span className="flex-1 text-left">{item.label}</span>
              {item.agent && (
                <span
                  className={cn(
                    "rounded-md px-1.5 py-0.5 text-[10px] font-medium tabular-nums",
                    isActive
                      ? "bg-primary/15 text-primary"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {item.agent.replace("Agente ", "A")}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <button
          onClick={() => onSelect("settings")}
          aria-current={active === "settings" ? "page" : undefined}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
            active === "settings"
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
          )}
        >
          <Settings className="h-4.5 w-4.5 shrink-0" />
          Settings
        </button>
      </div>
    </aside>
  )
}
