<script setup lang="ts">
/**
 * AppSidebar: Main navigation sidebar with agent subtitle hierarchy.
 * Layer: shared/ui
 */
import type { Component } from 'vue'
import {
  LayoutDashboard,
  Newspaper,
  SatelliteDishIcon,
  FileText,
  Users,
  Bot,
  MessageSquare,
  Settings,
  Sparkles,
} from '@lucide/vue'
import { navItems, settingsEntry } from '~~/shared/config/navigation'
import { cn } from '~~/shared/lib/utils'

const route = useRoute()

const iconMap: Record<string, Component> = {
  LayoutDashboard,
  Newspaper,
  SatelliteDishIcon,
  FileText,
  Users,
  Bot,
  MessageSquare,
  Settings,
  Sparkles,
}

function isActive(itemRoute: string): boolean {
  return route.path === itemRoute
}

function handleNavigate(itemRoute: string): void {
  navigateTo(itemRoute)
}
</script>

<template>
  <aside class="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
    <!-- Logo / Brand -->
    <div class="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-6">
      <div
        class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"
      >
        <component :is="iconMap.Sparkles" class="h-4 w-4" />
      </div>
      <div class="flex flex-col leading-tight">
        <span class="text-sm font-semibold text-sidebar-foreground">Marketing AI</span>
        <span class="text-xs text-muted-foreground">Autonomous Team</span>
      </div>
    </div>

    <!-- Main Navigation -->
    <nav class="flex flex-1 flex-col gap-1.5 p-3">
      <button
        v-for="item in navItems"
        :key="item.id"
        type="button"
        :aria-current="isActive(item.route) ? 'page' : undefined"
        :class="
          cn(
            'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors w-full',
            isActive(item.route)
              ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-xs'
              : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
          )
        "
        @click="handleNavigate(item.route)"
      >
        <component
          :is="iconMap[item.iconName]"
          :class="
            cn(
              'h-5 w-5 shrink-0 transition-colors',
              isActive(item.route)
                ? 'text-primary'
                : 'text-muted-foreground group-hover:text-sidebar-foreground',
            )
          "
        />
        <div class="flex flex-col min-w-0 flex-1 text-left">
          <span class="text-sm font-medium leading-snug truncate">{{ item.label }}</span>
          <span
            v-if="item.agent"
            :class="
              cn(
                'text-[11px] font-normal leading-tight truncate transition-colors mt-0.5',
                isActive(item.route)
                  ? 'text-primary font-medium'
                  : 'text-muted-foreground/80 group-hover:text-sidebar-foreground/90',
              )
            "
          >
            {{ item.agent }}
          </span>
        </div>
      </button>
    </nav>

    <!-- Settings (footer) -->
    <div class="border-t border-sidebar-border p-3">
      <button
        type="button"
        :aria-current="isActive(settingsEntry.route) ? 'page' : undefined"
        :class="
          cn(
            'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
            isActive(settingsEntry.route)
              ? 'bg-sidebar-accent text-sidebar-accent-foreground'
              : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
          )
        "
        @click="handleNavigate(settingsEntry.route)"
      >
        <component :is="iconMap.Settings" class="h-5 w-5 shrink-0" />
        <span class="text-sm font-medium">Settings</span>
      </button>
    </div>
  </aside>
</template>
