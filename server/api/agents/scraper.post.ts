import { defineEventHandler, createError } from 'h3'
import { randomUUID } from 'node:crypto'
import { GoogleGenAI, Type } from '@google/genai'
import { NewsIdeasResponseSchema, type ExtractedNews, type NewsIdea } from '../../../entities/news/types'
import { getFirestoreDb, FieldValue } from '../../../server/utils/firebase'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/**
 * JSON Schema for Gemini Structured Outputs (@google/genai SDK)
 */
const newsIdeaJsonSchema = {
  type: Type.ARRAY,
  description: 'Lista de exactamente 10 ideas de contenido generadas a partir de las noticias proveídas',
  items: {
    type: Type.OBJECT,
    properties: {
      id: {
        type: Type.STRING,
        description: 'Identificador único UUID v4 para la idea',
      },
      sourceUrl: {
        type: Type.STRING,
        description: 'URL fuente exacta de la noticia de donde proviene la idea',
      },
      headline: {
        type: Type.STRING,
        description: 'Titular de la noticia analizada',
      },
      contentIdea: {
        type: Type.STRING,
        description: 'Propuesta estratégica de contenido en formato Markdown estructurado con Hook, Desarrollo y Call to Action (CTA)',
      },
      platforms: {
        type: Type.ARRAY,
        items: {
          type: Type.STRING,
        },
        description: 'Plataformas optimizadas para este contenido (Instagram Reel, TikTok, YouTube Short, YouTube Long, Instagram Carousel, etc.)',
      },
      status: {
        type: Type.STRING,
        description: 'Estado inicial de la idea (siempre pending_review)',
      },
      createdAt: {
        type: Type.STRING,
        description: 'Fecha y hora de generación en formato ISO 8601',
      },
    },
    required: ['id', 'sourceUrl', 'headline', 'contentIdea', 'platforms', 'status', 'createdAt'],
  },
}

/**
 * System Prompt para el Agente 1 (News Scraper & Content Ideation)
 */
const systemInstruction = `Eres un Estratega de Contenido y Director Creativo de Marketing de nivel Senior para una agencia de crecimiento y marcas tecnológicas.
Tu objetivo es analizar un conjunto de noticias de última hora sobre tecnología, marketing e inteligencia artificial, y transformarlas en exactamente 10 ideas de contenido viral y de alto impacto para redes sociales.

REGLAS ESTRICTAS DE SEGURIDAD Y CALIDAD (CERO ALUCINACIONES):
1. CERO ALUCINACIONES: Solo debes generar ideas a partir de las noticias que se te proveen en el prompt de entrada. Cada idea DEBE estar vinculada a una 'sourceUrl' real y verificable tomada de las noticias dadas.
2. DIVERSIDAD MULTIPLATAFORMA: Distribuye las 10 ideas cubriendo una mezcla equilibrada de formatos:
   - Instagram (Reels dinámicos, Carruseles educativos)
   - YouTube (Shorts con ganchos rápidos, Videos largos estilo tutorial/análisis)
   - TikTok (Tendencias explicativas, detrás de escena, storytelling)
3. ESTRUCTURA DE 'contentIdea': Cada propuesta debe redactarse en Markdown limpio y profesional incluyendo:
   - Formato sugerido (ej. "### Reel / TikTok: ...")
   - **Hook (Gancho):** Primeros 3 segundos para captar atención.
   - **Desarrollo:** Puntos clave o guión paso a paso del contenido.
   - **CTA (Llamado a la acción):** Pregunta o palabra clave para generar interacción y captar leads.
4. Genera identificadores UUID válidos para el campo 'id', define 'status' como 'pending_review' y 'createdAt' en formato ISO 8601.`

/**
 * AGENTE 1: News Scraper & Content Ideation
 * Endpoint: POST /api/agents/scraper
 * 
 * Pipeline:
 * 1. Extracción: Obtiene noticias relevantes (Mockeado: 3 noticias)
 * 2. Filtrado: Descarta contenido negativo / no alineado
 * 3. Ideación (LLM Gemini 1.5 Flash): Genera 10 ideas de contenido con Structured Outputs
 * 4. Validación: Valida con esquema Zod (NewsIdeasResponseSchema)
 * 5. Almacenamiento: Guarda en Firestore (Fase C)
 */
export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig()
    const apiKey = (config.geminiApiKey as string) || process.env.NUXT_GEMINI_API_KEY

    if (!apiKey || apiKey === 'tu_api_key_aqui') {
      throw createError({
        statusCode: 400,
        statusMessage: 'API Key de Gemini no configurada. Por favor define tu clave en el archivo .env (NUXT_GEMINI_API_KEY).',
      })
    }

    // --- Paso 1: Extracción Web (Mock de Brave Search MCP / Tavily) ---
    const extractedNews: ExtractedNews[] = [
      {
        headline: 'OpenAI presenta nuevo modelo o3 con capacidades avanzadas de razonamiento',
        sourceUrl: 'https://techcrunch.com/2026/openai-o3-announcement',
        snippet: 'OpenAI ha anunciado su nuevo modelo enfocado en resolver problemas complejos de matemáticas, código y ciencias con razonamiento paso a paso.',
        publishedAt: new Date().toISOString(),
      },
      {
        headline: 'Google Cloud expande integración de agentes autónomos para empresas',
        sourceUrl: 'https://cloud.google.com/blog/products/ai-machine-learning/enterprise-agents',
        snippet: 'Nuevas soluciones de orquestación de agentes IA permiten automatizar flujos de marketing, ventas y soporte en tiempo real con observabilidad integral.',
        publishedAt: new Date().toISOString(),
      },
      {
        headline: 'Meta lanza herramientas de creación publicitaria basadas en IA generativa',
        sourceUrl: 'https://about.fb.com/news/2026/meta-ai-ads-suite',
        snippet: 'Las nuevas APIs permiten a marcas crear variaciones infinitas de creativos para Reels y Stories optimizados automáticamente según la audiencia.',
        publishedAt: new Date().toISOString(),
      },
    ]

    // Regla de Seguridad (Cero alucinaciones): Si no hay noticias, abortar con 0 ideas.
    if (extractedNews.length === 0) {
      return {
        success: true,
        count: 0,
        data: [],
        message: 'No hay noticias relevantes hoy.',
      }
    }

    // --- Paso 2: Filtrado ---
    // TODO: Implementar filtrado por `negative_keywords` y `target_audience_profile` desde Firestore `settings`
    const filteredNews = extractedNews.filter((news) => {
      const negativeKeywords = ['politica', 'sucesos', 'deportes']
      const text = `${news.headline} ${news.snippet}`.toLowerCase()
      return !negativeKeywords.some((kw) => text.includes(kw))
    })

    if (filteredNews.length === 0) {
      return {
        success: true,
        count: 0,
        data: [],
        message: 'Todas las noticias fueron descartadas por los filtros de seguridad.',
      }
    }

    // --- Paso 3: Ideación con Gemini Flash (Structured Outputs) ---
    const ai = new GoogleGenAI({ apiKey })

    const response = await ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `Aquí tienes las noticias filtradas del día para ideación de contenido:\n\n${JSON.stringify(filteredNews, null, 2)}\n\nGenera exactamente 10 ideas de contenido innovadoras, estructuradas y listas para revisión humana.`,
            },
          ],
        },
      ],
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: newsIdeaJsonSchema,
        temperature: 0.7,
      },
    })

    const rawText = response.text || '[]'
    let parsedRawData: any
    try {
      parsedRawData = JSON.parse(rawText)
    } catch {
      throw createError({
        statusCode: 502,
        statusMessage: 'Error al parsear la respuesta estructurada de Gemini como JSON.',
      })
    }

    // Normalización defensiva para asegurar cumplimiento con tipos antes de validación Zod
    const itemsArray = Array.isArray(parsedRawData) ? parsedRawData : [parsedRawData]
    const preparedIdeas = itemsArray.map((item: any) => ({
      id: typeof item.id === 'string' && UUID_REGEX.test(item.id) ? item.id : randomUUID(),
      sourceUrl: typeof item.sourceUrl === 'string' && item.sourceUrl.startsWith('http') ? item.sourceUrl : (filteredNews[0]?.sourceUrl || 'https://techcrunch.com'),
      headline: item.headline || 'Titular de Noticia',
      contentIdea: item.contentIdea || 'Idea de contenido generada.',
      platforms: Array.isArray(item.platforms) && item.platforms.length > 0 ? item.platforms : ['Instagram Reel', 'TikTok'],
      status: 'pending_review',
      createdAt: item.createdAt || new Date().toISOString(),
    }))

    // --- Paso 4: Validación con Zod ---
    const validatedIdeas: NewsIdea[] = NewsIdeasResponseSchema.parse(preparedIdeas)

    // --- Paso 5: Almacenamiento en Firestore (Fase C) ---
    const firestore = getFirestoreDb()
    const batch = firestore.batch()
    const collectionRef = firestore.collection('news_ideas')

    for (const idea of validatedIdeas) {
      const docRef = collectionRef.doc(idea.id)
      batch.set(docRef, {
        id: idea.id,
        sourceUrl: idea.sourceUrl,
        headline: idea.headline,
        contentIdea: idea.contentIdea,
        platforms: idea.platforms,
        status: 'pending_review',
        createdAt: FieldValue.serverTimestamp(),
      })
    }

    await batch.commit()

    return {
      success: true,
      count: validatedIdeas.length,
      data: validatedIdeas,
      executedAt: new Date().toISOString(),
      message: 'Agente 1 ejecutado exitosamente. Ideas generadas y persistidas en Firestore.',
    }
  } catch (error: any) {
    if (error?.statusCode) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: `Error en Agente 1 (ScraperNews): ${error?.message || 'Error desconocido'}`,
    })
  }
})
