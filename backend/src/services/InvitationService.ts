import { adminDb } from '../config/firebase'
import { communicationService } from './CommunicationService'
import { auditService } from './AuditService'
import { logger } from '../utils/logger'
import crypto from 'crypto'

export class InvitationService {
  async inviteAdmin(email: string, role: string, inviterUid: string, requestId?: string): Promise<string> {
    const token = crypto.randomUUID()
    
    // Save to Firestore admin_invitations
    await adminDb.collection('admin_invitations').doc(token).set({
      email: email.trim().toLowerCase(),
      role: role,
      status: 'pending',
      invitedBy: inviterUid,
      createdAt: new Date(),
    })
    
    // Send email
    // Hardcode frontend URL for now, or get from env
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
    const invitationUrl = `${frontendUrl}/admin/accept-invitation?token=${token}`
    
    await communicationService.sendAdminInvitation(email, role, invitationUrl, requestId)
    
    // Audit log
    await auditService.log({
      action: 'invitation_sent',
      actorUid: inviterUid,
      targetEmail: email,
      details: { role },
      requestId
    })
    
    return token
  }

  async acceptInvitation(token: string, uid: string, email: string, requestId?: string): Promise<boolean> {
    // 1. Verify invitation
    const docRef = adminDb.collection('admin_invitations').doc(token)
    const docSnap = await docRef.get()
    
    if (!docSnap.exists) {
      throw new Error('Invitation not found')
    }
    
    const data = docSnap.data()
    if (data?.status !== 'pending' || data?.email !== email) {
      throw new Error('Invalid or already accepted invitation')
    }
    
    // 2. Create admin document in Firestore
    await adminDb.collection('admins').doc(uid).set({
      email: email,
      systemRole: data.role,
      status: 'active',
      token: token,
      activatedAt: new Date(),
      twoFactorEnabled: false
    })
    
    // 3. Mark invitation accepted
    await docRef.update({
      status: 'accepted'
    })
    
    // 4. Audit log
    await auditService.log({
      action: 'admin_activated',
      actorUid: uid,
      targetEmail: email,
      details: { role: data.role },
      requestId
    })
    
    return true
  }
}

export const invitationService = new InvitationService()
