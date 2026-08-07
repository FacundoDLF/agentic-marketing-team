# ASDD AI Model Governance, SSOT & Architecture Directives

> **ASDD Mandatory Policy**: Todo nuevo Agente, Feature o Componente debe apegarse estrictamente a las directivas de arquitectura, gobernanza de modelos de IA y al principio permanente de Single Source of Truth (SSOT).

---

## 1. Principio Permanente: Single Source of Truth (SSOT)

> **Principio SSOT (Single Source of Truth):** Queda estrictamente prohibido duplicar strings mágicos, configuraciones, metadatos de agentes, endpoints o estructuras de datos en múltiples archivos. Cada entidad, constante o regla de negocio debe tener una única fuente de verdad centralizada (en archivos de constantes, utils o tipos compartidos). El IDE tiene la obligación proactiva de identificar duplicaciones o valores hardcodeados durante cualquier refactorización o creación de código, y extraerlos automáticamente hacia su fuente centralizada correspondiente.

### Fuentes de Verdad Centralizadas del Proyecto:
- **Metadatos y Modelos de Agentes**: `shared/constants/agents.ts` (`AGENTS`).
- **Navegación, Rutas y Títulos**: `shared/config/navigation.ts` (`navItems`, `tabMeta`).
- **Esquemas y Tipos de Datos (Zod + TS)**: `entities/*/types.ts`.
- **Capa de Comunicación con Agentes**: `services/agentService.ts`.

---

## 2. Gobernanza de Modelos de IA (Right-Sizing Matrix)

1. **Declaración Explícita Obligatoria desde SSOT**:
   - Queda estrictamente prohibido invocar endpoints de IA con modelos por defecto globales no documentados o valores implícitos.
   - Cada agente en `server/api/agents/` debe exportar su modelo asignado consumiendo directamente la constante centralizada:
     ```typescript
     import { AGENTS } from '../../../shared/constants/agents'

     export const AI_MODEL = AGENTS.SCRAPY.model // o AGENTS.COPPY_HOOK.model
     ```

2. **Criterios de Asignación por Nivel Cognitivo (Right-Sizing Matrix)**:

| Nivel de Tarea | Complejidad Cognitiva | Modelo Asignado | Casos de Uso |
| :--- | :--- | :--- | :--- |
| **Tier 1: High-Volume / Extracción / Ideación** | Baja a Media (Velocidad, Extracción JSON, Deduplicación, Ideación breve) | `gemini-3.5-flash-lite` | **Scrapy Agent (Agente 1)**: News Scraping, filtrado temático, estructuración de ideas crudas. |
| **Tier 2: Copywriting Creativo / Multi-Formato** | Media-Alta (Hooks magnéticos, Guiones de video, Captions, Hashtags, CTA) | `gemini-3.5-flash-lite` (Dev/Prod) / `gemini-2.5-pro` (Deep copy) | **Coppy-Hook Agent (Agente 2)**: Redacción creativa estructurada, guiones y captions listos para publicar. |
| **Tier 3: Supervisión & QA** | Media-Alta (Validación semántica, Moderación, Compliance) | `gemini-3.5-flash` | **Supervisor / QA Agent**: Auditoría de calidad y validación de directrices de marca. |

---

## 3. Throttling y Control de Tasa (Rate Limiting)

- Para agentes de volumen que procesan múltiples entradas (como noticias o feeds):
  - El procesamiento DEBE ser secuencial utilizando un bucle `for` o `for...of`.
  - Debe incorporarse una pausa obligatoria (**Throttling**) de al menos 4 segundos entre llamadas consecutivas:
    ```typescript
    await new Promise(r => setTimeout(r, 4000))
    ```
  - Evitar ráfagas masivas en paralelo (`Promise.all` para múltiples llamadas LLM simultáneas) que saturen la cuota por minuto (RPM) de la API.

---

## 4. Guardián Automatizado (CI / ASDD Test Guardian)

El test `test/ai-model-governance.test.ts` valida en tiempo de desarrollo e integración continua que:
- La fuente de verdad `AGENTS` contiene metadatos válidos de todos los agentes.
- Todos los agentes en `server/api/agents/*.ts` exportan `AI_MODEL` enlazado a su respectivo `AGENTS.*.model`.
- Si un agente o feature introduce modelos hardcodeados o rompe la gobernanza, el pipeline falla inmediatamente.
