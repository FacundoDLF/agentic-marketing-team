import { defineEventHandler, createError } from 'h3'
import { randomUUID } from 'node:crypto'
import Parser from 'rss-parser'
import { GoogleGenAI, Type } from '@google/genai'
import { NewsIdeasResponseSchema, type ExtractedNews, type NewsIdea } from '../../../entities/news/types'
import { getFirestoreDb, FieldValue } from '../../../server/utils/firebase'
import { AGENTS } from '../../../shared/constants/agents'

/**
 * ASDD AI Model Governance Declaration
 * Agent: Scrapy Agent (Agent 1 - News Scraper & Content Ideation)
 * Cognitive Complexity: Low / Repetitive Volume / Extraction & Ideation
 * Right-Sized Model Tier: Lite (gemini-3.5-flash-lite)
 */
export const AI_MODEL = AGENTS.SCRAPY.model

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/**
 * JSON Schema for Gemini Structured Outputs (@google/genai SDK)
 */
const newsIdeaJsonSchema = {
  type: Type.ARRAY,
  description: 'Lista de ideas de contenido estratégico para JL Masajistas generadas a partir de las noticias reales provistas',
  items: {
    type: Type.OBJECT,
    properties: {
      id: {
        type: Type.STRING,
        description: 'Identificador único UUID v4 para la idea',
      },
      sourceUrl: {
        type: Type.STRING,
        description: 'URL fuente exacta e inalterada de la noticia real de donde proviene la idea (tomada estrictamente del listado proveído)',
      },
      headline: {
        type: Type.STRING,
        description: 'Titular de la noticia analizada',
      },
      contentIdea: {
        type: Type.STRING,
        description: 'Propuesta estratégica de contenido en formato Markdown estructurado con Hook (3 seg), Desarrollo y Call to Action (CTA)',
      },
      platforms: {
        type: Type.ARRAY,
        items: {
          type: Type.STRING,
        },
        description: 'Plataformas optimizadas para este contenido (Instagram Reel, TikTok, YouTube Short, YouTube Long, Instagram Carousel)',
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
 * System Prompt para Scrapy Agent (News Scraper & Content Ideation) - JL Masajistas
 */
const systemInstruction = `Eres el Director Creativo de Marketing y Estratega de Contenido Senior de "JL Masajistas", una destacada empresa de Rosario (Santa Fe, Argentina) especializada en:
- Masajes descontracturantes, relajantes y terapéuticos.
- Kinesiología deportiva y protocolos de recuperación muscular para atletas y deportistas.
- Masajes en eventos corporativos y jornadas deportivas.
- Pausas activas y programas de bienestar y salud ocupacional para empresas (B2B).
- Tercerización y alianzas con productoras de eventos, clínicas, gimnasios y centros de entrenamiento.

PÚBLICO OBJETIVO (TARGET AUDIENCE):
Gerentes de Recursos Humanos que buscan beneficios de salud y pausas activas para sus empleados, productoras de eventos, dueños de gimnasios y clínicas, además de deportistas y particulares con estrés crónico o dolores musculares en la región de Rosario y Gran Rosario, Santa Fe.

FILTRO GEOGRÁFICO Y ADAPTACIÓN LOCAL ESTRICTA:
El cliente opera en Rosario y Gran Rosario, Santa Fe. Debes descartar artículos que hablen de sucesos hiper-locales de otros países (ej. México, España) u otras provincias lejanas (ej. Salta, Jujuy). Solo utiliza noticias de Rosario, o noticias nacionales/globales generales (ej. tendencias de salud, pausas activas, home office, ergonomía, estrés laboral) que puedas adaptar y localizar en el copy para el público rosarino.

MAPEO 1:2 ESTRICTO (2 IDEAS POR ARTÍCULO):
Por CADA artículo procesado de la lista proveída, DEBES generar exactamente DOS (2) ideas de contenido en formatos distintos (ej. Idea 1: Instagram Reel / TikTok dinámico con gancho visual, Idea 2: Carrusel educativo o Video largo para YouTube con guía paso a paso). Si procesas N artículos, la respuesta final DEBE contener 2 ideas por cada uno de los N artículos.

OPORTUNIDADES ESTACIONALES (VOUCHERS Y GIFT CARDS):
JL Masajistas vende masivamente Vouchers y Gift Cards para fechas especiales. Si el artículo trata sobre una festividad, feriado o evento conmemorativo cercano (ej. Día del Maestro, Día de la Secretaria, San Valentín, Navidad, Día del Amigo, Día de la Madre, Día de la Primavera), enfoca la idea de contenido en vender la experiencia de regalar relax y salud. Para fechas corporativas (Día de la Secretaria, Día del Maestro, Fin de Año, Día del Trabajador) puedes enfocar la propuesta en pausas activas o paquetes de bienestar para empresas de Rosario.

REGLAS ESTRICTAS DE SEGURIDAD Y CALIDAD (CERO ALUCINACIONES):
1. REGLA ESTRICTA DE CONEXIÓN TEMÁTICA (OBLIGATORIO): Las ideas de contenido que generes DEBEN tener una relación temática directa, lógica y evidente con el 'headline' y 'snippet' del artículo proporcionado. NO inventes ideas genéricas (ej. 'pausas activas para oficinas') si la noticia no habla de trabajo corporativo. Tu trabajo es encontrar el ángulo creativo que conecte el tema EXACTO de la noticia (ej. un evento deportivo, una ola de calor, un feriado, un festival, una carrera, voluntariado, actividad cultural) con los servicios de kinesiología y masajes de JL Masajistas. Si la noticia es sobre voluntarios en un evento, propón contenido sobre recuperación física para voluntarios. Si la noticia es sobre una maratón, propón recuperación pre/post carrera. Si es sobre clima extremo, enfócalo en alivio de tensiones causadas por el clima. Prohibido ignorar el tema del artículo.
2. CERO ALUCINACIONES DE FUENTES: El campo 'sourceUrl' DEBE ser exactamente la URL real proveída en el artículo fuente correspondiente. Para las 2 ideas derivadas de un mismo artículo, ambas deben compartir la 'sourceUrl' de dicho artículo.
3. DIVERSIDAD MULTIPLATAFORMA: Distribuye los formatos de manera complementaria:
   - Instagram (Reels dinámicos, Carruseles educativos de prevención de lesiones/postura/pausas activas)
   - TikTok (Demostraciones prácticas, mitos de masajes, cómo estirar en la oficina o en casa)
   - YouTube (Shorts de alto impacto, Guías completas de recuperación muscular)
4. ESTRUCTURA DE 'contentIdea' (Markdown limpio):
   - Formato sugerido (ej. "### Instagram Reel: ...")
   - **Hook (Gancho inicial):** Primeros 3 segundos impactantes para frenar el scroll conectando directamente con el tema de la noticia.
   - **Desarrollo:** Puntos clave, guión o explicación práctica conectando la noticia con los servicios de JL Masajistas en Rosario.
   - **CTA (Llamado a la acción):** Pregunta o llamado claro orientado a comentar, agendar sesión o solicitar propuesta B2B para empresas en Rosario.
5. REGLA DE FORMATO VISUAL (OBLIGATORIO Y ESTRICTO): Tu respuesta DEBE estar estructurada visualmente para ser fácil de leer:
   - Usa saltos de línea dobles (\n\n) para separar cada sección (ej. Hook, Desarrollo, CTA).
   - NO envuelvas todo el texto en negrita.
   - Usa la negrita (**) ÚNICAMENTE para resaltar los nombres de las secciones o conceptos hiper-clave. Ejemplo: **Hook:** ¿Sabías que...
   - Usa viñetas convencionales (-) o listas numeradas en el 'Desarrollo' si propones un carrusel o pasos a seguir.
6. Genera identificadores UUID válidos para 'id', define 'status' como 'pending_review' y 'createdAt' en formato ISO 8601.`

/**
 * Palabras clave negativas para descartar contenido no deseado
 */
const NEGATIVE_KEYWORDS = [
  'policiales',
  'policial',
  'política',
  'politica',
  'escándalo',
  'escandalo',
  'denuncias',
  'denuncia',
  'accidentes',
  'accidente',
  'esoterismo',
  'misticismo',
  'software',
  'it',
  'eróticos',
  'eroticos',
  'crimen',
  'robo',
  'homicidio',
]

type ScraperTimeframe = '1d' | '90d' | '180d' | 'next_15d' | 'next_30d'

// --- Configuración de queries RSS (separadas para el patrón Divide y Vencerás) ---
const QUERY_INDUSTRY = '(kinesiologia+OR+masajes+OR+%22bienestar+corporativo%22+OR+fisiatria+OR+%22salud+ocupacional%22)+AND+(%22Rosario%22+OR+location:rosario)'
const QUERY_SEASONAL = '(%22D%C3%ADa+de+la+Madre%22+OR+%22San+Valentin%22+OR+%22D%C3%ADa+del+Maestro%22+OR+%22D%C3%ADa+de+la+Secretaria%22+OR+%22Primavera%22+OR+%22Gift+Card%22+OR+%22Navidad%22+OR+%22Regalos%22)+AND+(%22Rosario%22+OR+location:rosario)'

const RSS_BASE = 'https://news.google.com/rss/search'
const RSS_PARAMS = '&hl=es-419&gl=AR&ceid=AR:es-419'

/** Formatea una fecha como YYYY-MM-DD para los operadores after:/before: de Google News */
function fmtDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * Construye los parámetros de contexto temporal para cada modo:
 */
function buildTemporalContext(timeframe: ScraperTimeframe): {
  after: Date
  before: Date
  label: string
  urlTimeSuffix: string
} {
  const today = new Date()

  if (timeframe === '1d') {
    const after = new Date(Date.now() - 24 * 60 * 60 * 1000)
    return { after, before: today, label: 'Hoy (Últimas 24hs)', urlTimeSuffix: '+when:1d' }
  }
  if (timeframe === '90d') {
    const after = new Date(today)
    after.setDate(after.getDate() - 90)
    return { after, before: today, label: 'Últimos 90 días', urlTimeSuffix: '' }
  }
  if (timeframe === '180d') {
    const after = new Date(today)
    after.setDate(after.getDate() - 180)
    return { after, before: today, label: 'Últimos 180 días', urlTimeSuffix: '' }
  }

  // Time Machine: misma ventana del año pasado (15 o 30 días)
  const daysForward = timeframe === 'next_15d' ? 15 : 30
  const yearAgo = new Date(today)
  yearAgo.setFullYear(today.getFullYear() - 1)
  const before = new Date(yearAgo)
  before.setDate(before.getDate() + daysForward)
  const afterStr = fmtDate(yearAgo)
  const beforeStr = fmtDate(before)
  const label = `Time Machine: ${afterStr} → ${beforeStr}`
  const urlTimeSuffix = `+after:${afterStr}+before:${beforeStr}`
  console.info(`[Scrapy Agent] ${label}`)
  return { after: yearAgo, before, label, urlTimeSuffix }
}

/**
 * SCRAPY AGENT: News Scraper & Content Ideation (Inbox Quota, RSS & Manual URL Bypass)
 * Endpoint: POST /api/agents/scraper
 * Body: { timeframe?: '1d' | '90d' | '180d' | 'next_15d' | 'next_30d', manualUrl?: string }
 */
export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig()
    const apiKey = (config.geminiApiKey as string) || process.env.NUXT_GEMINI_API_KEY

    if (!apiKey || apiKey === 'tu_api_key_aqui') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message: 'API Key de Gemini no configurada. Por favor define tu clave en el archivo .env (NUXT_GEMINI_API_KEY).',
      })
    }

    const body = await readBody(event).catch(() => ({}))
    const manualUrl = typeof body?.manualUrl === 'string' ? body.manualUrl.trim() : ''

    const firestore = getFirestoreDb()

    // --- ACCIÓN 1: Cálculo de Cuota (Límite 10) ---
    let pendingCount = 0
    try {
      const pendingSnapshot = await firestore
        .collection('news_ideas')
        .where('status', '==', 'pending_review')
        .get()
      pendingCount = pendingSnapshot.size
    } catch (fsError: any) {
      console.warn(`[Scrapy Agent] Error al consultar cuota en Firestore: ${fsError?.message}`)
    }

    const slotsLibres = 10 - pendingCount
    console.info(`[Scrapy Agent] Cuota: ${pendingCount} pendientes, ${slotsLibres} slots libres`)

    // --- ACCIÓN 2: Deduplicación Global (Set histórico de URLs) ---
    const processedUrls = new Set<string>()
    try {
      const allDocsSnapshot = await firestore.collection('news_ideas').select('sourceUrl').get()
      allDocsSnapshot.forEach((doc) => {
        const url = doc.data()?.sourceUrl
        if (url) processedUrls.add(url)
      })
      console.info(`[Scrapy Agent] Deduplicación global: ${processedUrls.size} URLs históricas en Firestore`)
    } catch (fsError: any) {
      console.warn(`[Scrapy Agent] Error al consultar URLs históricas: ${fsError?.message}`)
    }

    let targetNews: ExtractedNews[] = []

    // --- FLUJO A: BYPASS MANUAL DE URL ---
    if (manualUrl) {
      if (!manualUrl.startsWith('http://') && !manualUrl.startsWith('https://')) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Bad Request',
          message: 'La URL ingresada no es válida. Debe comenzar con http:// o https://',
        })
      }

      // Validar cuota: 1 noticia requiere al menos 2 slots
      if (slotsLibres < 2) {
        return {
          success: true,
          count: 0,
          data: [],
          message: 'Bandeja_Llena',
        }
      }

      // Validar deduplicación
      if (processedUrls.has(manualUrl)) {
        return {
          success: false,
          count: 0,
          data: [],
          message: 'URL_DUPLICADA',
        }
      }

      console.info(`[Scrapy Agent] Modo Manual: Procesando URL directa ${manualUrl}`)

      // Fetch nativo ligero para extraer <title>, <meta description>, <article:section> y <keywords> / <article:tag>
      let headline = 'Noticia sobre salud y bienestar'
      let desc = ''
      let section = ''
      let keywords = ''
      let pubDateExtracted = ''

      try {
        const html = await $fetch<string>(manualUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          },
          timeout: 8000,
        })

        // 1. Extraer título
        const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/is)
        if (titleMatch && titleMatch[1]) {
          headline = titleMatch[1].replace(/(\r\n|\n|\r)/gm, ' ').replace(/&nbsp;/g, ' ').trim()
        }

        // Helper genérico para extraer tags por name o property
        const getMetaContent = (namesOrProps: string[]): string => {
          for (const key of namesOrProps) {
            const regex1 = new RegExp(`<meta[^>]+(?:name|property)=["']${key}["'][^>]+content=["']([^"']*)["']`, 'is')
            const match1 = html.match(regex1)
            if (match1 && match1[1]) return match1[1].trim()

            const regex2 = new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:name|property)=["']${key}["']`, 'is')
            const match2 = html.match(regex2)
            if (match2 && match2[1]) return match2[1].trim()
          }
          return ''
        }

        // 2. Extraer descripción
        desc = getMetaContent(['og:description', 'description', 'twitter:description'])

        // 3. Extraer sección / categoría
        section = getMetaContent(['article:section', 'section', 'category', 'news_keywords'])

        // 4. Extraer keywords o tags
        keywords = getMetaContent(['keywords', 'article:tag', 'news_keywords', 'tags'])

        // 5. Extraer fecha de publicación
        pubDateExtracted = getMetaContent(['article:published_time', 'pubdate', 'date', 'og:article:published_time', 'og:published_time'])
      } catch (fetchErr: any) {
        console.warn(`[Scrapy Agent] No se pudo scrapear metadata de la URL manual: ${fetchErr?.message}`)
      }

      // Construir contexto enriquecido estructurado para Gemini
      const metaParts: string[] = []
      if (desc) metaParts.push(`Descripción: ${desc}`)
      if (section) metaParts.push(`Categoría: ${section}`)
      if (keywords) metaParts.push(`Keywords: ${keywords}`)

      const enrichedSnippet = metaParts.length > 0 ? metaParts.join(' | ') : headline

      targetNews = [{
        headline,
        sourceUrl: manualUrl,
        snippet: enrichedSnippet,
        publishedAt: pubDateExtracted && !isNaN(new Date(pubDateExtracted).getTime())
          ? new Date(pubDateExtracted).toISOString()
          : new Date().toISOString(),
      }]
    } else {
      // --- FLUJO B: ESCANEO AUTOMÁTICO GOOGLE NEWS RSS ---
      if (slotsLibres <= 0) {
        console.info(`[Scrapy Agent] Bandeja llena (${pendingCount} pendientes). Abortando escaneo.`)
        return {
          success: true,
          count: 0,
          data: [],
          message: 'Bandeja_Llena',
        }
      }

      const timeframe: ScraperTimeframe =
        (['1d', '90d', '180d', 'next_15d', 'next_30d'] as const).includes(body?.timeframe)
          ? (body.timeframe as ScraperTimeframe)
          : '1d'

      const temporal = buildTemporalContext(timeframe)
      console.info(`[Scrapy Agent] timeframe=${timeframe} | ${temporal.label}`)

      const parser = new Parser({
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        },
      })

      const urlIndustry = `${RSS_BASE}?q=${QUERY_INDUSTRY}${temporal.urlTimeSuffix}${RSS_PARAMS}`
      const urlSeasonal = `${RSS_BASE}?q=${QUERY_SEASONAL}${temporal.urlTimeSuffix}${RSS_PARAMS}`

      const [industryResult, seasonalResult] = await Promise.allSettled([
        parser.parseURL(urlIndustry),
        parser.parseURL(urlSeasonal),
      ])

      const industryItems = industryResult.status === 'fulfilled' ? (industryResult.value.items || []) : []
      const seasonalItems = seasonalResult.status === 'fulfilled' ? (seasonalResult.value.items || []) : []

      if (industryResult.status === 'rejected') {
        console.warn(`[Scrapy Agent] Query industria falló: ${industryResult.reason?.message}`)
      }
      if (seasonalResult.status === 'rejected') {
        console.warn(`[Scrapy Agent] Query estacional falló: ${seasonalResult.reason?.message}`)
      }

      // Merge + deduplicar por link/guid
      const seenLinks = new Set<string>()
      const mergedRaw: any[] = []
      for (const item of [...industryItems, ...seasonalItems]) {
        const link = (item.link || item.guid || '').trim()
        if (link && !seenLinks.has(link)) {
          seenLinks.add(link)
          mergedRaw.push(item)
        }
      }

      // Ordenar por pubDate desc
      mergedRaw.sort((a, b) => {
        const da = new Date(a.isoDate || a.pubDate || 0).getTime()
        const db = new Date(b.isoDate || b.pubDate || 0).getTime()
        return db - da
      })

      // Filtrar por negative keywords + rango temporal + Set histórico
      const filteredNews: ExtractedNews[] = []
      const seenUrls = new Set<string>()

      for (const item of mergedRaw) {
        const title = (item.title || '').trim()
        const link = (item.link || '').trim()
        const snippet = (item.contentSnippet || item.content || item.summary || title).trim()
        const textToEval = `${title} ${snippet}`.toLowerCase()

        const hasNegative = NEGATIVE_KEYWORDS.some((kw) => textToEval.includes(kw))
        if (hasNegative || !title || !link.startsWith('http') || seenUrls.has(link)) continue

        if (item.isoDate || item.pubDate) {
          const pubDate = new Date(item.isoDate || item.pubDate)
          if (!isNaN(pubDate.getTime())) {
            if (pubDate < temporal.after || pubDate > temporal.before) continue
          }
        }

        if (processedUrls.has(link)) {
          continue
        }

        seenUrls.add(link)
        filteredNews.push({
          headline: title,
          sourceUrl: link,
          snippet: snippet.slice(0, 300),
          publishedAt: item.isoDate || item.pubDate || new Date().toISOString(),
        })
      }

      if (filteredNews.length === 0) {
        console.info(`[Scrapy Agent] RSS_Agotado — no hay noticias frescas en este período`)
        return {
          success: true,
          count: 0,
          data: [],
          message: 'RSS_Agotado',
        }
      }

      const articlesNeeded = Math.ceil(slotsLibres / 2)
      targetNews = filteredNews.slice(0, articlesNeeded)
      console.info(`[Scrapy Agent] Llenado exacto: slotsLibres=${slotsLibres}, articlesNeeded=${articlesNeeded}, targetNews=${targetNews.length}`)
    }

    // --- Paso 4: Ideación Secuencial con Gemini Lite (Throttling & Right-sizing) ---
    const ai = new GoogleGenAI({ apiKey })
    const allGeneratedIdeas: any[] = []

    for (let i = 0; i < targetNews.length; i++) {
      const article = targetNews[i]
      if (!article) continue

      console.info(`[${AGENTS.SCRAPY.name}] (${i + 1}/${targetNews.length}) Ideando con ${AI_MODEL}: "${article.headline.slice(0, 60)}..."`)

      let response: any = null
      let attempts = 0
      const maxAttempts = 2

      while (attempts < maxAttempts) {
        attempts++
        try {
          response = await ai.models.generateContent({
            model: AI_MODEL,
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text: `A continuación tienes el artículo de noticia real seleccionado para salud, masajes, kinesiología y bienestar en Rosario / Argentina:\n\n${JSON.stringify([article], null, 2)}\n\nINSTRUCCIONES CLAVE:\n- Genera exactamente DOS (2) ideas de contenido en formatos complementarios adaptadas al público de Rosario y clientes de "JL Masajistas".\n- El array final debe contener exactamente 2 ideas.\n- Cada idea DEBE mantener el campo 'sourceUrl' estrictamente idéntico a "${article.sourceUrl}".`,
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
          break // Éxito
        } catch (genError: any) {
          const errMsg = String(genError?.message || genError)
          const isRateLimit = errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('quota')

          if (isRateLimit && attempts < maxAttempts) {
            console.warn(`[Scrapy Agent] Rate limit temporal en intento ${attempts}. Pausando 4s antes de reintentar...`)
            await new Promise((r) => setTimeout(r, 4000))
            continue
          }
          throw genError
        }
      }

      const rawText = response?.text || '[]'
      try {
        const parsed = JSON.parse(rawText)
        if (Array.isArray(parsed)) {
          allGeneratedIdeas.push(...parsed)
        } else if (parsed) {
          allGeneratedIdeas.push(parsed)
        }
      } catch {
        throw createError({
          statusCode: 502,
          statusMessage: 'Bad Gateway',
          message: 'Error al parsear la respuesta estructurada de Gemini como JSON.',
        })
      }

      // Throttling obligatorio: 4 segundos al final de cada iteración
      if (i < targetNews.length - 1) {
        console.info(`[Scrapy Agent] Throttling ASDD: Pausando 4s antes del siguiente artículo...`)
        await new Promise((r) => setTimeout(r, 4000))
      }
    }

    const itemsArray = allGeneratedIdeas
    const fallbackUrl = targetNews[0]?.sourceUrl || 'https://news.google.com'

    const preparedIdeas = itemsArray.map((item: any, index: number) => {
      const matchedSource = targetNews.find((n) => n.sourceUrl === item.sourceUrl)
      const validSourceUrl = matchedSource ? matchedSource.sourceUrl : (targetNews[Math.floor(index / 2) % targetNews.length]?.sourceUrl || fallbackUrl)
      const publishedAt = matchedSource?.publishedAt || targetNews[Math.floor(index / 2) % targetNews.length]?.publishedAt || new Date().toISOString()

      return {
        id: typeof item.id === 'string' && UUID_REGEX.test(item.id) ? item.id : randomUUID(),
        sourceUrl: validSourceUrl,
        headline: item.headline || (matchedSource?.headline || 'Bienestar y Recuperación Muscular - JL Masajistas'),
        contentIdea: item.contentIdea || 'Propuesta de contenido estratégico para JL Masajistas.',
        platforms: Array.isArray(item.platforms) && item.platforms.length > 0 ? item.platforms : ['Instagram Reel', 'TikTok'],
        publishedAt,
        status: 'pending_review',
        createdAt: item.createdAt || new Date().toISOString(),
      }
    })

    // Validación con Zod
    const validatedIdeas: NewsIdea[] = NewsIdeasResponseSchema.parse(preparedIdeas)

    // Ajustar exactamente al cupo disponible
    const finalIdeas = validatedIdeas.slice(0, slotsLibres)

    // --- Paso 5: Almacenamiento en Firestore ---
    const batch = firestore.batch()
    const collectionRef = firestore.collection('news_ideas')

    for (const idea of finalIdeas) {
      const docRef = collectionRef.doc(idea.id)
      batch.set(docRef, {
        id: idea.id,
        sourceUrl: idea.sourceUrl,
        headline: idea.headline,
        contentIdea: idea.contentIdea,
        platforms: idea.platforms,
        publishedAt: idea.publishedAt || new Date().toISOString(),
        status: 'pending_review',
        createdAt: FieldValue.serverTimestamp(),
      })
    }

    await batch.commit()

    return {
      success: true,
      count: finalIdeas.length,
      data: finalIdeas,
      executedAt: new Date().toISOString(),
      message: 'OK',
    }
  } catch (error: any) {
    if (error?.statusCode) {
      throw error
    }

    const rawMessage = String(error?.message || error || '')
    let userFriendlyMessage = rawMessage

    if (rawMessage.includes('429') || rawMessage.includes('RESOURCE_EXHAUSTED') || rawMessage.includes('quota')) {
      userFriendlyMessage = 'Límite de solicitudes de la API de Gemini alcanzado (Cuota temporal del plan gratuito de Google). Por favor aguardá 10 a 20 segundos antes de volver a escanear.'
    } else if (rawMessage.includes('API_KEY_INVALID') || rawMessage.includes('401') || rawMessage.includes('403')) {
      userFriendlyMessage = 'Clave API de Gemini inválida o sin permisos suficientes. Verificá tu NUXT_GEMINI_API_KEY en el archivo .env.'
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: `Error en ${AGENTS.SCRAPY.name} (ScraperNews): ${userFriendlyMessage}`,
    })
  }
})
