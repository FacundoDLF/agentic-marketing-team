"use client"

import { Search, Bell } from "lucide-react"

export function Topbar({ title }: { title: string }) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-border bg-background/80 px-4 backdrop-blur md:px-6">
      <div className="flex flex-col md:hidden">
        <span className="text-sm font-semibold">Marketing AI</span>
      </div>

      <h1 className="hidden text-lg font-semibold tracking-tight md:block">
        {title}
      </h1>

      <div className="relative ml-auto w-full max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          placeholder="Buscar noticias, leads, copys..."
          aria-label="Búsqueda global"
          className="h-9 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30"
        />
      </div>

      <button
        type="button"
        aria-label="Notificaciones"
        className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-input bg-card text-muted-foreground transition-colors hover:text-foreground"
      >
        <Bell className="h-4.5 w-4.5" />
        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive ring-2 ring-card" />
      </button>

      <button
        type="button"
        aria-label="Perfil de usuario"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
      >
        JD
      </button>
    </header>
  )
}
