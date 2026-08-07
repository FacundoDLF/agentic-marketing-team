<script setup lang="ts">
/**
 * Dashboard Page (Index) — Main overview of the autonomous marketing team.
 *
 * Integrates KPI stats and the 4 core widgets:
 * 1. PendingNewsWidget (Agent 1 - Scraper)
 * 2. LatestCopyWidget (Agent 2 - Borradores)
 * 3. QualifiedLeadsWidget (Agent 3 - Leads)
 * 4. OrchestratorChatWidget (Agent 4 - Orquestador)
 */
import { SatelliteDishIcon, FileText, Users, CheckCircle2 } from '@lucide/vue'
import {
  PendingNewsWidget,
  LatestCopyWidget,
  QualifiedLeadsWidget,
  OrchestratorChatWidget,
} from '~~/widgets'

const stats = [
  { label: 'Radar de Tendencias', value: '3', icon: SatelliteDishIcon },
  { label: 'Copys en revisión', value: '5', icon: FileText },
  { label: 'Leads calificados', value: '12', icon: Users },
  { label: 'Aprobados hoy', value: '8', icon: CheckCircle2 },
]
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- Welcome Header -->
    <div>
      <h2 class="text-xl font-semibold tracking-tight">Buenos días, Juan</h2>
      <p class="text-sm text-muted-foreground">
        Tu equipo de IA tiene acciones esperando tu aprobación.
      </p>
    </div>

    <!-- Quick Stats Grid -->
    <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <div
        v-for="stat in stats"
        :key="stat.label"
        class="flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-sm"
      >
        <div
          class="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground"
        >
          <component :is="stat.icon" class="h-5 w-5" />
        </div>
        <div class="flex flex-col">
          <span class="text-2xl font-semibold tabular-nums">
            {{ stat.value }}
          </span>
          <span class="text-xs text-muted-foreground">{{ stat.label }}</span>
        </div>
      </div>
    </div>

    <!-- Main Widgets Grid -->
    <div class="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <!-- Left / Primary Column (News & Leads) -->
      <div class="flex flex-col gap-6 xl:col-span-2">
        <PendingNewsWidget />
        <QualifiedLeadsWidget />
      </div>

      <!-- Right / Secondary Column (Copy Mockup & Orchestrator Chat) -->
      <div class="flex flex-col gap-6">
        <LatestCopyWidget />
        <div class="h-[480px]">
          <OrchestratorChatWidget />
        </div>
      </div>
    </div>
  </div>
</template>
