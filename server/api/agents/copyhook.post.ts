import { defineEventHandler, readBody, createError } from 'h3'
import { GoogleGenAI, Type } from '@google/genai'
import { getFirestoreDb, FieldValue } from '../../../server/utils/firebase'
import { AGENTS } from '../../../shared/constants/agents'

/**
 * ASDD AI Model Governance: Coppy-Hook Agent (Creative Copywriter & Scriptwriter)
 * Layer: server/api/agents
 */
export const AI_MODEL = AGENTS.COPPY_HOOK.model

/**
 * System Prompt: Coppy-Hook Agent (La Persona)
 */
const systemInstruction = `Eres "${AGENTS.COPPY_HOOK.name}", el Social Media Copywriter y Guionista Creativo Senior especializado en Kinesiología, Masajes Terapéuticos y Bienestar para "JL Masajistas" en Rosario (Santa Fe, Argentina).

TU MISIÓN:
Tomar una idea estratégica cruda y su contexto de noticia real para transformarla en una pieza de contenido y copy de alto impacto lista para publicar en la plataforma seleccionada (ej. Instagram Reel, TikTok, Carrusel de Instagram, YouTube Short, LinkedIn).

PÚBLICO Y CONTEXTO LOCAL:
- Deportistas y runners de Rosario (recuperación muscular, descarga miofascial, prevención de lesiones).
- Personas con estrés, tensión cervical y malas posturas de trabajo en oficinas y home office en Rosario.
- Gerentes de Recursos Humanos y empresas que buscan programas de pausas activas y masajes corporativos in-company.

TONO Y ESTILO:
- Profesional, cercano, empático y persuasivo.
- Lenguaje natural argentino adaptado a la audiencia de Rosario (Gran Rosario) sin caer en lunfardos excesivos.
- Estructura limpia y fácil de leer.

REGLA DE FORMATO DE SALIDA (OBLIGATORIA Y ESTRICTA):
Debes generar una propuesta completa con las 5 secciones estructuradas:
1. Hook (3s): Gancho inicial de 3 segundos potente, disruptivo y magnético para frenar el scroll.
2. Cuerpo / Guión: Contenido principal adaptado a la plataforma (guión de video con acotaciones visuales, carrusel paso a paso o explicación de valor).
3. Caption: Texto persuasivo optimizado para la descripción del post, con saltos de línea.
4. Hashtags: Lista de 5 a 10 hashtags relevantes y geolocalizados para Rosario.
5. CTA: Llamado a la acción claro y directo.`

/**
 * Schema JSON para salida estructurada de Coppy-Hook Agent
 */
const copyhookJsonSchema = {
  type: Type.OBJECT,
  description: 'Estructura de copy generada por Coppy-Hook Agent',
  properties: {
    hook: {
      type: Type.STRING,
      description: 'Gancho inicial de 3 segundos potente para frenar el scroll',
    },
    body: {
      type: Type.STRING,
      description: 'Contenido principal o guión adaptado a la plataforma seleccionada',
    },
    caption: {
      type: Type.STRING,
      description: 'Texto para la descripción del post en redes sociales',
    },
    hashtags: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Lista de 5 a 10 hashtags relevantes con #',
    },
    cta: {
      type: Type.STRING,
      description: 'Llamado a la acción claro y directo',
    },
  },
  required: ['hook', 'body', 'caption', 'hashtags', 'cta'],
}

/**
 * Endpoint: POST /api/agents/copyhook
 * Body: { ideaId?: string, headline: string, contentIdea: string, platform: string, sourceUrl?: string }
 */
export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig()
    const apiKey = (config.geminiApiKey as string) || process.env.NUXT_GEMINI_API_KEY

    if (!apiKey || apiKey === 'tu_api_key_aqui') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message:
          'API Key de Gemini no configurada. Por favor define tu clave en el archivo .env (NUXT_GEMINI_API_KEY).',
      })
    }

    const body = await readBody(event).catch(() => ({}))
    let headline = typeof body?.headline === 'string' ? body.headline.trim() : ''
    let contentIdea = typeof body?.contentIdea === 'string' ? body.contentIdea.trim() : ''
    const platform = typeof body?.platform === 'string' ? body.platform.trim() : 'Instagram Reel'
    let sourceUrl = typeof body?.sourceUrl === 'string' ? body.sourceUrl.trim() : ''
    const ideaId = typeof body?.ideaId === 'string' ? body.ideaId.trim() : ''
    const targetField = typeof body?.targetField === 'string' ? body.targetField.trim() : undefined
    const currentSections = body?.currentSections && typeof body.currentSections === 'object' ? body.currentSections : undefined

    // Si se pasa ideaId pero no headline o contentIdea, cargarlos de Firestore
    if (ideaId && (!headline || !contentIdea)) {
      try {
        const firestore = getFirestoreDb()
        const docSnap = await firestore.collection('news_ideas').doc(ideaId).get()
        if (docSnap.exists) {
          const docData = docSnap.data()
          if (!headline && docData?.headline) headline = docData.headline
          if (!contentIdea && docData?.contentIdea) contentIdea = docData.contentIdea
          if (!sourceUrl && docData?.sourceUrl) sourceUrl = docData.sourceUrl
        }
      } catch (fsErr: any) {
        console.warn(
          `[Coppy-Hook Agent] Error al consultar Firestore para ideaId ${ideaId}:`,
          fsErr?.message,
        )
      }
    }

    if (!headline || !contentIdea) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message:
          'Faltan parámetros obligatorios: headline y contentIdea son requeridos (o un ideaId válido).',
      })
    }

    console.info(
      `[Coppy-Hook Agent] Iniciando redacción para plataforma: "${platform}" ${targetField ? `(Campo objetivo: ${targetField})` : ''} con modelo ${AI_MODEL}`,
    )

    // --- ASDD Throttling obligatorio: Pausa de 4 segundos ---
    console.info('[Coppy-Hook Agent] Aplicando Throttling ASDD (4s)...')
    await new Promise((r) => setTimeout(r, 4000))

    const ai = new GoogleGenAI({ apiKey })

    let userPrompt = `INFORMACIÓN DE ENTRADA:
- Titular de Noticia / Contexto: "${headline}"
- Idea Estratégica Base: "${contentIdea}"
- Plataforma Objetivo: "${platform}"
${sourceUrl ? `- Fuente original: "${sourceUrl}"` : ''}`

    if (targetField) {
      userPrompt += `\n\nOBJETIVO ESPECÍFICO DE REGENERACIÓN:
Regenera una propuesta fresca, creativa y de alto impacto para la sección "${targetField}".
${currentSections ? `Contenido actual existente: ${JSON.stringify(currentSections)}` : ''}
Mantén el tono empático, profesional y local de JL Masajistas en Rosario, devolviendo el JSON completo con "${targetField}" renovado.`
    } else {
      userPrompt += `\n\nINSTRUCCIONES:
Redacta el copy definitivo optimizado específicamente para ${platform} siguiendo la personalidad de JL Masajistas y generando todas las secciones obligatorias.`
    }

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
              parts: [{ text: userPrompt }],
            },
          ],
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: copyhookJsonSchema,
            temperature: 0.7,
          },
        })
        break
      } catch (genError: any) {
        const errMsg = String(genError?.message || genError)
        const isRateLimit =
          errMsg.includes('429') ||
          errMsg.includes('RESOURCE_EXHAUSTED') ||
          errMsg.includes('quota')

        if (isRateLimit && attempts < maxAttempts) {
          console.warn(
            `[Coppy-Hook Agent] Rate limit temporal en intento ${attempts}. Pausando 4s antes de reintentar...`,
          )
          await new Promise((r) => setTimeout(r, 4000))
          continue
        }
        throw genError
      }
    }

    const rawText = response?.text || '{}'
    let parsed: any
    try {
      parsed = JSON.parse(rawText)
    } catch {
      throw createError({
        statusCode: 502,
        statusMessage: 'Bad Gateway',
        message: 'Error al parsear la respuesta estructurada de Coppy-Hook Agent como JSON.',
      })
    }

    // Formatear hashtags con #
    const hashtagsList: string[] = Array.isArray(parsed.hashtags)
      ? parsed.hashtags.map((h: string) => (h.startsWith('#') ? h : `#${h.trim()}`))
      : ['#JLMasajistas', '#Rosario', '#MasajesTerapeuticos', '#Kinesiologia', '#Bienestar']

    const hashtagsFormatted = hashtagsList.join(' ')

    // Construir salida con formato Markdown requerido
    const structuredCopy = `### ⚓ Hook (3s)
${parsed.hook || '¿Sentís tensión acumulada después de una larga jornada?'}

### 📝 Cuerpo / Guión
${parsed.body || contentIdea}

### 💬 Caption
${parsed.caption || 'En JL Masajistas cuidamos de tu salud postural y recuperación muscular en Rosario.'}

### #️⃣ Hashtags
${hashtagsFormatted}

### 🎯 CTA
${parsed.cta || 'Comentá o envianos un mensaje directo para coordinar tu sesión en Rosario.'}`

    // Si se envió un ideaId, actualizar el documento en Firestore
    if (ideaId) {
      try {
        const firestore = getFirestoreDb()
        const docRef = firestore.collection('news_ideas').doc(ideaId)
        await docRef.update({
          status: 'copy_ready',
          copyFormatted: structuredCopy,
          copySections: {
            hook: parsed.hook || '',
            body: parsed.body || '',
            caption: parsed.caption || '',
            hashtags: hashtagsList,
            cta: parsed.cta || '',
          },
          copyPlatform: platform,
          updatedAt: FieldValue.serverTimestamp(),
        })
        console.info(
          `[Coppy-Hook Agent] Documento Firestore ${ideaId} actualizado con el copy generado.`,
        )
      } catch (fsErr: any) {
        console.warn(
          `[Coppy-Hook Agent] No se pudo persistir en Firestore (${ideaId}): ${fsErr?.message}`,
        )
      }
    }

    return {
      success: true,
      data: {
        ideaId: ideaId || undefined,
        platform,
        formattedCopy: structuredCopy,
        sections: {
          hook: parsed.hook,
          body: parsed.body,
          caption: parsed.caption,
          hashtags: hashtagsList,
          cta: parsed.cta,
        },
      },
      model: AI_MODEL,
      executedAt: new Date().toISOString(),
    }
  } catch (error: any) {
    if (error?.statusCode) {
      throw error
    }

    const rawMessage = String(error?.message || error || '')
    let userFriendlyMessage = rawMessage

    if (
      rawMessage.includes('429') ||
      rawMessage.includes('RESOURCE_EXHAUSTED') ||
      rawMessage.includes('quota')
    ) {
      userFriendlyMessage =
        'Límite de solicitudes de la API de Gemini alcanzado (Cuota temporal). Por favor aguardá unos segundos antes de reintentar.'
    } else if (
      rawMessage.includes('API_KEY_INVALID') ||
      rawMessage.includes('401') ||
      rawMessage.includes('403')
    ) {
      userFriendlyMessage =
        'Clave API de Gemini inválida o sin permisos suficientes. Verificá tu NUXT_GEMINI_API_KEY en el archivo .env.'
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: `Error en ${AGENTS.COPPY_HOOK.name}: ${userFriendlyMessage}`,
    })
  }
})
