import { defineEventHandler, createError } from 'h3'
import { getFirestoreDb } from '../../../server/utils/firebase'
import type { NewsIdea } from '../../../entities/news/types'

/**
 * GET /api/ideas
 * Fetches active ideas from Firestore where status is 'pending_review' or 'approved'.
 * Returns ideas sorted by createdAt descending.
 */
export default defineEventHandler(async () => {
  try {
    const firestore = getFirestoreDb()
    const snapshot = await firestore
      .collection('news_ideas')
      .where('status', 'in', [
        'pending',
        'pending_review',
        'approved',
        'copy_generating',
        'copy_ready',
      ])
      .get()

    const ideas: NewsIdea[] = []

    snapshot.forEach((doc) => {
      const data = doc.data()
      let createdAtStr = new Date().toISOString()
      if (data.createdAt?.toDate && typeof data.createdAt.toDate === 'function') {
        createdAtStr = data.createdAt.toDate().toISOString()
      } else if (typeof data.createdAt === 'string') {
        createdAtStr = data.createdAt
      }

      ideas.push({
        id: doc.id,
        sourceUrl: data.sourceUrl || '',
        headline: data.headline || '',
        contentIdea: data.contentIdea || '',
        platforms: Array.isArray(data.platforms) ? data.platforms : ['Instagram Reel'],
        publishedAt: data.publishedAt || createdAtStr,
        status: data.status || 'pending_review',
        copyFormatted: data.copyFormatted || undefined,
        copySections: data.copySections || undefined,
        copyPlatform: data.copyPlatform || undefined,
        createdAt: createdAtStr,
      })
    })

    // Sort descending by createdAt (most recent first)
    ideas.sort((a, b) => {
      const da = new Date(a.createdAt).getTime()
      const db = new Date(b.createdAt).getTime()
      return db - da
    })

    return {
      success: true,
      count: ideas.length,
      data: ideas,
    }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: `Error al consultar ideas activas en Firestore: ${error?.message || 'Error desconocido'}`,
    })
  }
})
