import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

/**
 * ASDD Guardian Test: AI Model Governance & Right-Sizing
 * Validates that every AI agent or AI feature in server/api/agents/
 * explicitly declares its assigned AI model.
 */
describe('ASDD AI Model Governance Guardian', () => {
  const agentsDir = path.resolve(process.cwd(), 'server/api/agents')

  it('should verify all AI agent endpoints explicitly declare a valid AI_MODEL', () => {
    expect(fs.existsSync(agentsDir)).toBe(true)

    const files = fs.readdirSync(agentsDir).filter((file) => file.endsWith('.ts'))
    expect(files.length).toBeGreaterThan(0)

    for (const file of files) {
      const filePath = path.join(agentsDir, file)
      const content = fs.readFileSync(filePath, 'utf-8')

      // Verificar si el archivo interactúa con modelos de IA
      const usesAi =
        content.includes('@google/genai') ||
        content.includes('generateContent') ||
        content.includes('GoogleGenAI')

      if (usesAi) {
        // Regex para detectar la declaración explícita de AI_MODEL
        const modelMatch =
          content.match(/export\s+const\s+AI_MODEL\s*=\s*['"`]([^'"`]+)['"`]/) ||
          content.match(/const\s+AI_MODEL\s*=\s*['"`]([^'"`]+)['"`]/) ||
          content.match(/export\s+const\s+AGENT_AI_MODEL\s*=\s*['"`]([^'"`]+)['"`]/) ||
          content.match(/const\s+AGENT_AI_MODEL\s*=\s*['"`]([^'"`]+)['"`]/)

        if (!modelMatch || !modelMatch[1] || modelMatch[1].trim() === '') {
          throw new Error(
            `ASDD Error: Feature de IA sin modelo explícito asignado en el archivo: ${file}`
          )
        }

        const declaredModel = modelMatch[1].trim()

        // El modelo no puede ser nulo, indefinido ni genérico
        expect(
          declaredModel,
          `ASDD Error: Feature de IA sin modelo explícito asignado en ${file}`
        ).toBeTruthy()

        // Validar que pertenezca a la familia oficial de modelos Gemini
        expect(declaredModel.startsWith('gemini-')).toBe(true)

        console.info(`[ASDD Guardian] ✅ ${file} cumple la gobernanza con modelo asignado: "${declaredModel}"`)
      }
    }
  })

  it('should verify Scrapy Agent (scraper.post.ts) is right-sized to gemini-3.5-flash-lite', () => {
    const scraperPath = path.join(agentsDir, 'scraper.post.ts')
    const content = fs.readFileSync(scraperPath, 'utf-8')

    const modelMatch = content.match(/export\s+const\s+AI_MODEL\s*=\s*['"`]([^'"`]+)['"`]/)
    expect(modelMatch, 'ASDD Error: Feature de IA sin modelo explícito asignado').not.toBeNull()
    expect(modelMatch![1]).toBe('gemini-3.5-flash-lite')
  })

  it('should verify sequential loop with 4s throttling exists in scraper.post.ts', () => {
    const scraperPath = path.join(agentsDir, 'scraper.post.ts')
    const content = fs.readFileSync(scraperPath, 'utf-8')

    // Verificar que incluya setTimeout de 4000ms para throttling
    const hasThrottling =
      content.includes('setTimeout(r, 4000)') || content.includes('setTimeout(resolve, 4000)')

    expect(hasThrottling, 'ASDD Error: Scraper no incluye throttling de 4000ms').toBe(true)
  })

  it('should verify Coppy-Hook Agent (copyhook.post.ts) exists and is right-sized to gemini-3.5-flash-lite', () => {
    const copyhookPath = path.join(agentsDir, 'copyhook.post.ts')
    expect(fs.existsSync(copyhookPath), 'ASDD Error: copyhook.post.ts no existe').toBe(true)

    const content = fs.readFileSync(copyhookPath, 'utf-8')
    const modelMatch = content.match(/export\s+const\s+AI_MODEL\s*=\s*['"`]([^'"`]+)['"`]/)
    expect(modelMatch, 'ASDD Error: Feature de IA sin modelo explícito asignado en copyhook.post.ts').not.toBeNull()
    expect(modelMatch![1]).toBe('gemini-3.5-flash-lite')
  })

  it('should verify 4s throttling exists in copyhook.post.ts', () => {
    const copyhookPath = path.join(agentsDir, 'copyhook.post.ts')
    const content = fs.readFileSync(copyhookPath, 'utf-8')

    const hasThrottling =
      content.includes('setTimeout(r, 4000)') || content.includes('setTimeout(resolve, 4000)')

    expect(hasThrottling, 'ASDD Error: Coppy-Hook Agent no incluye throttling de 4000ms').toBe(true)
  })
})
