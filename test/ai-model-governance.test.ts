import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { AGENTS } from '../shared/constants/agents'
import { AI_MODEL as scraperModel } from '../server/api/agents/scraper.post'
import { AI_MODEL as copyhookModel } from '../server/api/agents/copyhook.post'

/**
 * ASDD Guardian Test: AI Model Governance & Single Source of Truth
 * Validates that all AI agents have explicit models configured in AGENTS
 * and that endpoints and UI consume the centralized single source of truth.
 */
describe('ASDD AI Model Governance Guardian', () => {
  const agentsDir = path.resolve(process.cwd(), 'server/api/agents')

  it('should verify single source of truth (AGENTS) contains valid metadata', () => {
    expect(AGENTS.SCRAPY.id).toBe('scrapy-agent')
    expect(AGENTS.SCRAPY.name).toBe('Scrapy Agent')
    expect(AGENTS.SCRAPY.model).toBe('gemini-3.5-flash-lite')

    expect(AGENTS.COPPY_HOOK.id).toBe('coppy-hook-agent')
    expect(AGENTS.COPPY_HOOK.name).toBe('Coppy-Hook Agent')
    expect(AGENTS.COPPY_HOOK.model).toBe('gemini-3.5-flash-lite')
  })

  it('should verify all AI agent endpoints explicitly declare and export AI_MODEL from AGENTS', () => {
    expect(fs.existsSync(agentsDir)).toBe(true)

    const files = fs.readdirSync(agentsDir).filter((file) => file.endsWith('.ts'))
    expect(files.length).toBeGreaterThan(0)

    for (const file of files) {
      const filePath = path.join(agentsDir, file)
      const content = fs.readFileSync(filePath, 'utf-8')

      const usesAi =
        content.includes('@google/genai') ||
        content.includes('generateContent') ||
        content.includes('GoogleGenAI')

      if (usesAi) {
        // Verificar que exporte AI_MODEL (literal o referenciando AGENTS)
        const hasExport =
          content.includes('export const AI_MODEL = AGENTS.') ||
          /export\s+const\s+AI_MODEL\s*=\s*['"`]([^'"`]+)['"`]/.test(content)

        expect(
          hasExport,
          `ASDD Error: Feature de IA sin AI_MODEL exportado en el archivo: ${file}`
        ).toBe(true)
      }
    }
  })

  it('should verify Scrapy Agent (scraper.post.ts) is bound to AGENTS.SCRAPY.model', () => {
    expect(scraperModel).toBe(AGENTS.SCRAPY.model)
    expect(scraperModel).toBe('gemini-3.5-flash-lite')
    console.info(`[ASDD Guardian] ✅ scraper.post.ts gobernado por AGENTS.SCRAPY.model ("${scraperModel}")`)
  })

  it('should verify sequential loop with 4s throttling exists in scraper.post.ts', () => {
    const scraperPath = path.join(agentsDir, 'scraper.post.ts')
    const content = fs.readFileSync(scraperPath, 'utf-8')

    const hasThrottling =
      content.includes('setTimeout(r, 4000)') || content.includes('setTimeout(resolve, 4000)')

    expect(hasThrottling, 'ASDD Error: Scraper no incluye throttling de 4000ms').toBe(true)
  })

  it('should verify Coppy-Hook Agent (copyhook.post.ts) is bound to AGENTS.COPPY_HOOK.model', () => {
    expect(copyhookModel).toBe(AGENTS.COPPY_HOOK.model)
    expect(copyhookModel).toBe('gemini-3.5-flash-lite')
    console.info(`[ASDD Guardian] ✅ copyhook.post.ts gobernado por AGENTS.COPPY_HOOK.model ("${copyhookModel}")`)
  })

  it('should verify 4s throttling exists in copyhook.post.ts', () => {
    const copyhookPath = path.join(agentsDir, 'copyhook.post.ts')
    const content = fs.readFileSync(copyhookPath, 'utf-8')

    const hasThrottling =
      content.includes('setTimeout(r, 4000)') || content.includes('setTimeout(resolve, 4000)')

    expect(hasThrottling, 'ASDD Error: Coppy-Hook Agent no incluye throttling de 4000ms').toBe(true)
  })
})
