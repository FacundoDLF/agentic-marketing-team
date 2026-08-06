"use client"

import { useState } from "react"
import { Bot, X } from "lucide-react"
import { OrchestratorChat } from "@/components/widgets/orchestrator-chat"

export function FloatingOrchestrator() {
  const [open, setOpen] = useState(false)

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
      {open && (
        <div className="h-[30rem] w-[22rem] max-w-[calc(100vw-3rem)] overflow-hidden shadow-2xl shadow-black/10">
          <OrchestratorChat />
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Cerrar orquestador" : "Abrir orquestador"}
        aria-expanded={open}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform hover:scale-105"
      >
        {open ? <X className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
      </button>
    </div>
  )
}
