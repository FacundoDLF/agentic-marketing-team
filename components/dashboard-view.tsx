import { Newspaper, FileText, Users, CheckCircle2 } from "lucide-react"
import { PendingNews } from "@/components/widgets/pending-news"
import { LatestCopy } from "@/components/widgets/latest-copy"
import { QualifiedLeads } from "@/components/widgets/qualified-leads"

const stats = [
  { label: "Noticias pendientes", value: "3", icon: Newspaper },
  { label: "Copys en revisión", value: "5", icon: FileText },
  { label: "Leads calificados", value: "12", icon: Users },
  { label: "Aprobados hoy", value: "8", icon: CheckCircle2 },
]

export function DashboardView() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Buenos días, Juan</h2>
        <p className="text-sm text-muted-foreground">
          Tu equipo de IA tiene acciones esperando tu aprobación.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-4"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-semibold tabular-nums">
                  {stat.value}
                </span>
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="flex flex-col gap-6 xl:col-span-2">
          <PendingNews />
          <QualifiedLeads />
        </div>
        <div className="flex flex-col gap-6">
          <LatestCopy />
        </div>
      </div>
    </div>
  )
}
