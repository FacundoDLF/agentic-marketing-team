import type { LucideIcon } from "lucide-react"

export function PlaceholderView({
  title,
  description,
  icon: Icon,
}: {
  title: string
  description: string
  icon: LucideIcon
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border bg-card/50 p-10 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
        <Icon className="h-7 w-7" />
      </div>
      <div className="flex max-w-md flex-col gap-1.5">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground text-pretty">{description}</p>
      </div>
      <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
        Próximamente
      </span>
    </div>
  )
}
