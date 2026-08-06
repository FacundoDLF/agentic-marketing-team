"use client"

import Image from "next/image"
import { Heart, MessageCircle, Send, Bookmark, FileText } from "lucide-react"

export function LatestCopy() {
  return (
    <section className="flex flex-col rounded-xl border border-border bg-card">
      <header className="flex items-center gap-2 border-b border-border px-5 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          <FileText className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-sm font-semibold">Últimos Copys Generados</h2>
          <p className="text-xs text-muted-foreground">Borradores (Agente 2)</p>
        </div>
        <span className="ml-auto rounded-md bg-chart-5/15 px-2 py-1 text-xs font-medium text-chart-5">
          En Revisión
        </span>
      </header>

      <div className="p-5">
        <article className="overflow-hidden rounded-xl border border-border">
          <div className="flex items-center gap-2.5 px-3 py-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
              MA
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-xs font-semibold">marketing.ai</span>
              <span className="text-[10px] text-muted-foreground">Publicación sugerida</span>
            </div>
          </div>

          <div className="relative aspect-square w-full">
            <Image
              src="/instagram-post.png"
              alt="Vista previa de publicación de Instagram generada por IA"
              fill
              sizes="(max-width: 768px) 100vw, 400px"
              className="object-cover"
            />
          </div>

          <div className="flex items-center gap-4 px-3 pt-3 text-foreground">
            <Heart className="h-5 w-5" />
            <MessageCircle className="h-5 w-5" />
            <Send className="h-5 w-5" />
            <Bookmark className="ml-auto h-5 w-5" />
          </div>

          <p className="px-3 pb-4 pt-2 text-xs leading-relaxed">
            <span className="font-semibold">marketing.ai</span>{" "}
            La IA generativa ya está redefiniendo el marketing B2B. Descubre cómo
            aumentar tu conversión un 40% sin ampliar tu equipo. 🚀{" "}
            <span className="text-primary">#MarketingAI #B2B #Growth</span>
          </p>
        </article>
      </div>
    </section>
  )
}
