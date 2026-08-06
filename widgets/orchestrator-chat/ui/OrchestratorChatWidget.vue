<script setup lang="ts">
/**
 * OrchestratorChatWidget — Orchestrator agent (Agent 4) interactive chat.
 *
 * FSD Layer: widgets/orchestrator-chat
 */
import { ref } from 'vue'
import { Bot, ArrowUp } from '@lucide/vue'

interface ChatMessage {
  role: 'assistant' | 'user'
  text: string
}

const suggestions = [
  'Genera 3 ideas de campaña',
  'Resume los leads de hoy',
  'Programa el mejor copy',
]

const messages = ref<ChatMessage[]>([
  {
    role: 'assistant',
    text: 'Hola 👋 Soy el Orquestador (Agente 4). Coordino a todo el equipo por ti. ¿Qué necesitas hacer hoy?',
  },
])

const input = ref('')

function send(text: string): void {
  const value = text.trim()
  if (!value) return

  messages.value.push({ role: 'user', text: value })
  input.value = ''

  // Mock assistant response
  setTimeout(() => {
    messages.value.push({
      role: 'assistant',
      text: 'Perfecto, coordinando a los agentes para ejecutar esa tarea. Te avisaré cuando haya borradores listos para tu aprobación.',
    })
  }, 300)
}

function handleKeyDown(e: KeyboardEvent): void {
  if (e.key === 'Enter' && !e.isComposing) {
    e.preventDefault()
    send(input.value)
  }
}
</script>

<template>
  <section class="flex h-full flex-col rounded-xl border border-border bg-card">
    <header class="flex items-center gap-2 border-b border-border px-5 py-4">
      <div
        class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"
      >
        <Bot class="h-4 w-4" />
      </div>
      <div>
        <h2 class="text-sm font-semibold">Orquestador Chat</h2>
        <p class="text-xs text-muted-foreground">
          Coordina a todos los agentes
        </p>
      </div>
      <span
        class="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground"
      >
        <span class="h-2 w-2 rounded-full bg-success" />
        Activo
      </span>
    </header>

    <!-- Chat Message List -->
    <div class="flex flex-1 flex-col gap-3 overflow-y-auto px-5 py-4">
      <div
        v-for="(m, i) in messages"
        :key="i"
        :class="
          m.role === 'user'
            ? 'ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3.5 py-2.5 text-sm text-primary-foreground'
            : 'mr-auto max-w-[85%] rounded-2xl rounded-bl-sm bg-muted px-3.5 py-2.5 text-sm text-foreground'
        "
      >
        {{ m.text }}
      </div>
    </div>

    <!-- Quick Suggestions -->
    <div class="flex flex-wrap gap-2 px-5 pb-3">
      <button
        v-for="s in suggestions"
        :key="s"
        type="button"
        class="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
        @click="send(s)"
      >
        {{ s }}
      </button>
    </div>

    <!-- Message Input -->
    <div class="border-t border-border p-3">
      <div
        class="flex items-center gap-2 rounded-xl border border-input bg-background px-3 py-2 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30"
      >
        <input
          v-model="input"
          placeholder="¿Qué necesitas hacer hoy?"
          aria-label="Mensaje para el orquestador"
          class="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          @keydown="handleKeyDown"
        />
        <button
          type="button"
          :disabled="!input.trim()"
          aria-label="Enviar mensaje"
          class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-opacity disabled:opacity-40"
          @click="send(input)"
        >
          <ArrowUp class="h-4 w-4" />
        </button>
      </div>
    </div>
  </section>
</template>
