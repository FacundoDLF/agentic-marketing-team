# ASDD AI Model Governance & Right-Sizing Architecture

> **ASDD Mandatory Policy**: Todo nuevo Agente o Feature de IA en `server/api/` debe declarar de forma explícita y documentada su modelo de IA principal según su complejidad cognitiva (Lite para tareas repetitivas/volumen, Pro/Flash pesado para copywriting creativo).

---

## 1. Principio Fundamental de Gobernanza (ASDD)

1. **Declaración Explícita Obligatoria**:
   - Queda estrictamente prohibido invocar endpoints de IA con modelos por defecto globales no documentados o valores implícitos.
   - Cada agente en `server/api/agents/` debe exportar o declarar explícitamente una constante:
     ```typescript
     export const AI_MODEL = 'gemini-3.5-flash-lite' // o el modelo asignado según su nivel
     ```

2. **Criterios de Asignación por Nivel Cognitivo (Right-Sizing Matrix)**:

| Nivel de Tarea | Complejidad Cognitiva | Modelo Asignado | Casos de Uso |
| :--- | :--- | :--- | :--- |
| **Tier 1: High-Volume / Extracción / Ideación** | Baja a Media (Velocidad, Extracción JSON, Deduplicación, Ideación breve) | `gemini-3.5-flash-lite` | **Scrapy Agent (Agente 1)**: News Scraping, filtrado temático, estructuración de ideas crudas. |
| **Tier 2: Copywriting Creativo / Multi-Formato** | Media-Alta (Hooks magnéticos, Guiones de video, Captions, Hashtags, CTA) | `gemini-3.5-flash-lite` (Dev/Prod) / `gemini-2.5-pro` (Deep copy) | **Coppy-Hook Agent (Agente 2)**: Redacción creativa estructurada, guiones y captions listos para publicar. |
| **Tier 3: Supervisión & QA** | Media-Alta (Validación semántica, Moderación, Compliance) | `gemini-3.5-flash` | **Supervisor / QA Agent**: Auditoría de calidad y validación de directrices de marca. |

---

## 2. Throttling y Control de Tasa (Rate Limiting)

- Para agentes de volumen que procesan múltiples entradas (como noticias o feeds):
  - El procesamiento DEBE ser secuencial utilizando un bucle `for...of`.
  - Debe incorporarse una pausa obligatoria (**Throttling**) de al menos 4 segundos entre llamadas consecutivas:
    ```typescript
    if (i < items.length - 1) {
      await new Promise(r => setTimeout(r, 4000))
    }
    ```
  - Evitar ráfagas masivas en paralelo (`Promise.all` para múltiples llamadas LLM simultáneas) que saturen la cuota por minuto (RPM) de la API.

---

## 3. Guardián Automatizado (CI / ASDD Test Guardian)

El test `test/ai-model-governance.test.ts` valida en tiempo de desarrollo e integración continua que:
- Todos los agentes en `server/api/agents/*.ts` cuenten con una declaración explícita de `AI_MODEL`.
- No existan llamadas anónimas u omitidas.
- Si un agente no declara su modelo, el pipeline falla inmediatamente con:
  `"ASDD Error: Feature de IA sin modelo explícito asignado"`.
