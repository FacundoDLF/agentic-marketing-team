<script setup lang="ts">
/**
 * QualifiedLeadsWidget: Leads agent qualified prospects table.
 * Layer: widgets/qualified-leads
 */
import { Users } from '@lucide/vue'
import { qualifiedLeads } from '~~/entities/lead'
import { SECTIONS } from '~~/shared/constants'
import { cn } from '~~/shared/lib/utils'

function scoreColor(score: number): string {
  if (score >= 85) return 'bg-success/10 text-success'
  if (score >= 70) return 'bg-chart-5/15 text-chart-5'
  return 'bg-muted text-muted-foreground'
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
}
</script>

<template>
  <section class="flex flex-col rounded-xl border border-border bg-card">
    <header class="flex items-center gap-2 border-b border-border px-5 py-4">
      <div
        class="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground"
      >
        <Users class="h-4 w-4" />
      </div>
      <div>
        <h2 class="text-sm font-semibold">{{ SECTIONS.LEADS.title }}</h2>
        <p class="text-xs text-muted-foreground">
          {{ SECTIONS.LEADS.label }} ({{ SECTIONS.LEADS.agent }})
        </p>
      </div>
    </header>

    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-border text-left text-xs text-muted-foreground">
            <th class="px-5 py-2.5 font-medium">Nombre</th>
            <th class="px-5 py-2.5 font-medium">Empresa</th>
            <th class="px-5 py-2.5 text-right font-medium">Match</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border">
          <tr
            v-for="lead in qualifiedLeads"
            :key="lead.id"
            class="transition-colors hover:bg-muted/50"
          >
            <td class="px-5 py-3">
              <div class="flex items-center gap-2.5">
                <div
                  class="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-[10px] font-semibold text-secondary-foreground"
                >
                  {{ getInitials(lead.name) }}
                </div>
                <span class="font-medium">{{ lead.name }}</span>
              </div>
            </td>
            <td class="px-5 py-3 text-muted-foreground">
              {{ lead.company }}
            </td>
            <td class="px-5 py-3 text-right">
              <span
                :class="
                  cn(
                    'inline-block rounded-md px-2 py-1 text-xs font-semibold tabular-nums',
                    scoreColor(lead.score),
                  )
                "
              >
                {{ lead.score }}/100
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
