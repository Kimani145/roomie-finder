import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from backend/.env
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

import { adminAuth, adminDb } from '../config/firebase'

async function bootstrapAdmin(targetUid: string) {
  console.log(`Starting admin elevation for UID: ${targetUid}`)

  try {
    // 1. Fetch user record from Firebase Auth
    let email = 'admin@roomiefinder.com'
    try {
      const userRecord = await adminAuth.getUser(targetUid)
      email = userRecord.email || email
      console.log(`Found user in Firebase Auth: ${email}`)
    } catch (authError: any) {
      console.warn(`Warning: User not found in Firebase Auth (${authError.message}). Creating admin doc directly.`)
    }

    // 2. Elevate user in Firestore admins collection
    const adminDocRef = adminDb.collection('admins').doc(targetUid)
    const adminDocSnap = await adminDocRef.get()

    const adminData = {
      email,
      systemRole: 'SUPER_ADMIN',
      status: 'active',
      twoFactorEnabled: adminDocSnap.exists ? (adminDocSnap.data()?.twoFactorEnabled ?? false) : false,
      activatedAt: adminDocSnap.exists ? (adminDocSnap.data()?.activatedAt ?? new Date()) : new Date(),
      updatedAt: new Date(),
    }

    await adminDocRef.set(adminData, { merge: true })
    console.log(`Successfully updated Firestore admins/${targetUid} with SUPER_ADMIN role.`)

    // 3. Optionally set custom claims on Auth token for fallback checks
    try {
      await adminAuth.setCustomUserClaims(targetUid, { admin: true, role: 'SUPER_ADMIN' })
      console.log(`Successfully set custom user claims on Firebase Auth for UID: ${targetUid}`)
    } catch (claimError: any) {
      console.warn(`Could not set custom claims: ${claimError.message}`)
    }

    console.log(`🎉 Elevation complete! User ${targetUid} (${email}) is now a SUPER_ADMIN.`)
    process.exit(0)
  } catch (error) {
    console.error('Failed to elevate user to admin:', error)
    process.exit(1)
  }
}

const targetUid = process.argv[2] || '9KMLzszL9XY7eYFpx2OasUkZUNH2'
bootstrapAdmin(targetUid)
