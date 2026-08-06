"use client"

import { Users } from "lucide-react"
import { qualifiedLeads } from "@/lib/data"
import { cn } from "@/lib/utils"

function scoreColor(score: number) {
  if (score >= 85) return "bg-success/10 text-success"
  if (score >= 70) return "bg-chart-5/15 text-chart-5"
  return "bg-muted text-muted-foreground"
}

export function QualifiedLeads() {
  return (
    <section className="flex flex-col rounded-xl border border-border bg-card">
      <header className="flex items-center gap-2 border-b border-border px-5 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          <Users className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-sm font-semibold">Leads Calificados</h2>
          <p className="text-xs text-muted-foreground">Leads (Agente 3)</p>
        </div>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="px-5 py-2.5 font-medium">Nombre</th>
              <th className="px-5 py-2.5 font-medium">Empresa</th>
              <th className="px-5 py-2.5 text-right font-medium">Match</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {qualifiedLeads.map((lead) => (
              <tr key={lead.id} className="transition-colors hover:bg-muted/50">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-[10px] font-semibold text-secondary-foreground">
                      {lead.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <span className="font-medium">{lead.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-muted-foreground">{lead.company}</td>
                <td className="px-5 py-3 text-right">
                  <span
                    className={cn(
                      "inline-block rounded-md px-2 py-1 text-xs font-semibold tabular-nums",
                      scoreColor(lead.score),
                    )}
                  >
                    {lead.score}/100
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
