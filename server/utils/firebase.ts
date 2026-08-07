import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { getApps, initializeApp, cert, type App } from 'firebase-admin/app'
import { getFirestore, type Firestore, FieldValue } from 'firebase-admin/firestore'

let firebaseApp: App | null = null
let firestoreDb: Firestore | null = null

/**
 * Initializes and retrieves the Firebase Admin Singleton instance
 */
export function getFirebaseAdminApp(): App {
  const existingApps = getApps()
  if (existingApps.length > 0 && existingApps[0]) {
    firebaseApp = existingApps[0]
    return firebaseApp
  }

  const keyPath = resolve(process.cwd(), 'firebase-admin-key.json')

  if (!existsSync(keyPath)) {
    throw new Error(
      `No se encontró el archivo de credenciales de Firebase en: ${keyPath}. Por favor coloca tu 'firebase-admin-key.json' en la raíz del proyecto.`,
    )
  }

  try {
    const rawKey = readFileSync(keyPath, 'utf-8')
    const serviceAccount = JSON.parse(rawKey)

    firebaseApp = initializeApp({
      credential: cert(serviceAccount),
    })

    return firebaseApp
  } catch (error: any) {
    throw new Error(
      `Error al inicializar Firebase Admin SDK: ${error?.message || 'Error desconocido'}`,
    )
  }
}

/**
 * Returns the Firestore Database instance (Singleton)
 */
export function getFirestoreDb(): Firestore {
  if (!firestoreDb) {
    const app = getFirebaseAdminApp()
    firestoreDb = getFirestore(app)
  }
  return firestoreDb
}

/**
 * Firestore Singleton instance export
 */
export const db = new Proxy({} as Firestore, {
  get(_target, prop, receiver) {
    const instance = getFirestoreDb()
    const value = Reflect.get(instance, prop, receiver)
    if (typeof value === 'function') {
      return value.bind(instance)
    }
    return value
  },
})

export { FieldValue }
