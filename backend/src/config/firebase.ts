import * as admin from 'firebase-admin'
import { logger } from '../utils/logger'

const projectId = process.env.FIREBASE_PROJECT_ID
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
// Handle multiline private keys in environment variables
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

if (!projectId) {
  logger.fatal('FIREBASE_PROJECT_ID is missing.')
  process.exit(1)
}

try {
  if (!admin.apps.length) {
    if (process.env.NODE_ENV === 'development' || process.env.FIRESTORE_EMULATOR_HOST) {
      logger.info('Initializing Firebase Admin SDK for local emulator mode.')
      admin.initializeApp({ projectId })
    } else {
      if (!clientEmail || !privateKey) {
        logger.fatal('Firebase Admin credentials missing. Crash immediately in production.')
        process.exit(1)
      }
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      })
      logger.info('Firebase Admin SDK initialized successfully.')
    }
  }
} catch (error) {
  logger.error('Failed to initialize Firebase Admin SDK', error)
  process.exit(1)
}

export const adminAuth = admin.auth()
export const adminDb = admin.firestore()
