import { defineEventHandler, readBody, createError } from 'h3'
import { getFirestoreDb, FieldValue } from '../../../server/utils/firebase'

const ALLOWED_STATUSES = ['pending_review', 'approved', 'rejected', 'archived'] as const

/**
 * PATCH /api/ideas/:id
 * Updates an idea's status in Firestore ('approved', 'rejected', 'archived').
 */
export default defineEventHandler(async (event) => {
  try {
    const id = event.context.params?.id
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message: 'ID de documento requerido.',
      })
    }

    const body = await readBody(event).catch(() => ({}))
    const status = body?.status

    if (!status || !ALLOWED_STATUSES.includes(status)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request',
        message: `Estado inválido. Debe ser uno de: ${ALLOWED_STATUSES.join(', ')}`,
      })
    }

    const firestore = getFirestoreDb()
    const docRef = firestore.collection('news_ideas').doc(id)
    const docSnap = await docRef.get()

    if (!docSnap.exists) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Not Found',
        message: `No se encontró la idea con ID ${id} en Firestore.`,
      })
    }

    await docRef.update({
      status,
      updatedAt: FieldValue.serverTimestamp(),
    })

    return {
      success: true,
      id,
      status,
      message: `Idea actualizada a status: '${status}' exitosamente.`,
    }
  } catch (error: any) {
    if (error?.statusCode) throw error
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: `Error al actualizar estado en Firestore: ${error?.message || 'Error desconocido'}`,
    })
  }
})
