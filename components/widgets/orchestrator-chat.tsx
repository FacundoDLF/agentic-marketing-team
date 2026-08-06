"use client"

import { useState } from "react"
import { Bot, ArrowUp } from "lucide-react"

type Message = { role: "assistant" | "user"; text: string }

const suggestions = [
  "Genera 3 ideas de campaña",
  "Resume los leads de hoy",
  "Programa el mejor copy",
]

export function OrchestratorChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Hola 👋 Soy el Orquestador (Agente 4). Coordino a todo el equipo por ti. ¿Qué necesitas hacer hoy?",
    },
  ])
  const [input, setInput] = useState("")

  const send = (text: string) => {
    const value = text.trim()
    if (!value) return
    setMessages((prev) => [
      ...prev,
      { role: "user", text: value },
      {
        role: "assistant",
        text: "Perfecto, coordinando a los agentes para ejecutar esa tarea. Te avisaré cuando haya borradores listos para tu aprobación.",
      },
    ])
    setInput("")
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      e.key === "Enter" &&
      !e.nativeEvent.isComposing &&
      e.keyCode !== 229
    ) {
      e.preventDefault()
      send(input)
    }
  }

  return (
    <section className="flex h-full flex-col rounded-xl border border-border bg-card">
      <header className="flex items-center gap-2 border-b border-border px-5 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Bot className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-sm font-semibold">Orquestador Chat</h2>
          <p className="text-xs text-muted-foreground">Coordina a todos los agentes</p>
        </div>
        <span className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-success" />
          Activo
        </span>
      </header>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-5 py-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={
              m.role === "user"
                ? "ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3.5 py-2.5 text-sm text-primary-foreground"
                : "mr-auto max-w-[85%] rounded-2xl rounded-bl-sm bg-muted px-3.5 py-2.5 text-sm text-foreground"
            }
          >
            {m.text}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 px-5 pb-3">
        {suggestions.map((s) => (
          <button
            key={s}
            onClick={() => send(s)}
            className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            {s}
          </button>
        ))}
      </div>

      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2 rounded-xl border border-input bg-background px-3 py-2 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="¿Qué necesitas hacer hoy?"
            aria-label="Mensaje para el orquestador"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <button
            onClick={() => send(input)}
            disabled={!input.trim()}
            aria-label="Enviar mensaje"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-opacity disabled:opacity-40"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  )
}
