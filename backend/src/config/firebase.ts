import * as admin from 'firebase-admin'
import { logger } from '../utils/logger'

const projectId = process.env.FIREBASE_PROJECT_ID
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
// Handle multiline private keys in environment variables
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

if (!projectId || !clientEmail || !privateKey) {
  logger.warn('Firebase Admin credentials not fully provided. Firestore and Auth verifications might fail if not in a default Google Cloud environment.')
}

try {
  if (!admin.apps.length) {
    if (projectId && clientEmail && privateKey && !privateKey.includes('MOCK_KEY')) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      })
    } else {
      admin.initializeApp() // Use application default credentials
    }
    logger.info('Firebase Admin SDK initialized successfully.')
  }
} catch (error) {
  logger.error('Failed to initialize Firebase Admin SDK', error)
  process.exit(1)
}

export const adminAuth = admin.auth()
export const adminDb = admin.firestore()
