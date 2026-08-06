"use client"

import { useState } from "react"
import { Check, X, Newspaper } from "lucide-react"
import { pendingNews } from "@/lib/data"
import { cn } from "@/lib/utils"

type Status = "pending" | "approved" | "discarded"

export function PendingNews() {
  const [statuses, setStatuses] = useState<Record<string, Status>>({})

  const setStatus = (id: string, status: Status) =>
    setStatuses((prev) => ({ ...prev, [id]: status }))

  return (
    <section className="flex flex-col rounded-xl border border-border bg-card">
      <header className="flex items-center gap-2 border-b border-border px-5 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          <Newspaper className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-sm font-semibold">Noticias Pendientes</h2>
          <p className="text-xs text-muted-foreground">Generadas por el Scraper (Agente 1)</p>
        </div>
        <span className="ml-auto rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary tabular-nums">
          {pendingNews.filter((n) => (statuses[n.id] ?? "pending") === "pending").length} nuevas
        </span>
      </header>

      <ul className="flex flex-col divide-y divide-border">
        {pendingNews.map((item) => {
          const status = statuses[item.id] ?? "pending"
          return (
            <li key={item.id} className="flex flex-col gap-3 px-5 py-4">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded bg-muted px-1.5 py-0.5 font-medium">
                    {item.angle}
                  </span>
                  <span>{item.source}</span>
                  <span aria-hidden>·</span>
                  <span>{item.time}</span>
                </div>
                <p className="text-sm font-medium leading-snug text-pretty">
                  {item.headline}
                </p>
              </div>

              {status === "pending" ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setStatus(item.id, "approved")}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-success px-3 py-1.5 text-xs font-medium text-success-foreground transition-opacity hover:opacity-90"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Aprobar
                  </button>
                  <button
                    onClick={() => setStatus(item.id, "discarded")}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-destructive px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
                  >
                    <X className="h-3.5 w-3.5" />
                    Descartar
                  </button>
                </div>
              ) : (
                <span
                  className={cn(
                    "inline-flex w-fit items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium",
                    status === "approved"
                      ? "bg-success/10 text-success"
                      : "bg-destructive/10 text-destructive",
                  )}
                >
                  {status === "approved" ? (
                    <>
                      <Check className="h-3.5 w-3.5" /> Aprobada
                    </>
                  ) : (
                    <>
                      <X className="h-3.5 w-3.5" /> Descartada
                    </>
                  )}
                </span>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
