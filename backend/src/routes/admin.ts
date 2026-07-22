import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { invitationService } from '../services/InvitationService'
import { authenticate } from '../middleware/authenticate'
import { requirePermission } from '../middleware/authorize'
import { profileRepository } from '../repositories/ProfileRepository'
import { EventBus } from '../events/EventBus'
import { Events } from '../events/EventCatalogue'
import { adminDb, adminAuth } from '../config/firebase'
import { totpService } from '../services/TotpService'
import { auditService } from '../services/AuditService'

export const adminRoutes: FastifyPluginAsyncZod = async (app) => {
  // Requires authentication and CREATE_ADMIN permission
  app.post(
    '/admin/invitations',
    {
      preHandler: [authenticate, requirePermission('CREATE_ADMIN')],
      schema: {
        description: 'Invite a new administrator',
        tags: ['admin'],
        security: [{ bearerAuth: [] }],
        body: z.object({
          email: z.string().email(),
          role: z.enum(['ADMIN', 'SUPER_ADMIN']),
        }),
        response: {
          200: z.object({
            success: z.boolean(),
            token: z.string(),
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { email, role } = request.body
      const token = await invitationService.inviteAdmin(email, role, request.user.uid, request.id)
      return { success: true, token, message: 'Invitation sent' }
    }
  )

  // Does NOT require authentication (used by the new admin clicking the link)
  app.post(
    '/admin/invitations/accept',
    {
      schema: {
        description: 'Accept an administrator invitation',
        tags: ['admin'],
        body: z.object({
          token: z.string(),
          uid: z.string(),
          email: z.string().email(),
        }),
        response: {
          200: z.object({
            success: z.boolean(),
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { token, uid, email } = request.body
      await invitationService.acceptInvitation(token, uid, email, request.id)
      return { success: true, message: 'Invitation accepted successfully' }
    }
  )

  // Requires authentication and MANAGE_USERS permission
  app.put(
    '/admin/users/:uid/status',
    {
      preHandler: [authenticate, requirePermission('MANAGE_USERS')],
      schema: {
        description: 'Update user account status',
        tags: ['admin'],
        security: [{ bearerAuth: [] }],
        params: z.object({
          uid: z.string(),
        }),
        body: z.object({
          status: z.enum(['active', 'banned']),
        }),
        response: {
          200: z.object({
            success: z.boolean(),
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { uid } = request.params
      const { status } = request.body
      
      const profile = await profileRepository.getById(uid)
      if (!profile) {
        return reply.status(404).send({ success: false, message: 'User not found' })
      }

      if (status === 'banned') {
        profile.ban()
      } else if (status === 'active') {
        if (profile.isBanned()) {
          profile.unban()
        } else {
          profile.activate()
        }
      }
      
      await profileRepository.save(profile)
      
      EventBus.publish(Events.PROFILE_UPDATED, { uid, changes: { status } })
      
      return { success: true, message: `User status updated to ${status}` }
    }
  )

  // ─── Admin TOTP 2FA Setup Endpoints ────────────────────────────────────────

  /**
   * POST /admin/2fa/setup
   * Generates a new TOTP Base32 secret, otpauth:// URI, and Base64 QR code Data URL.
   */
  app.post(
    '/admin/2fa/setup',
    {
      preHandler: [authenticate],
      schema: {
        description: 'Generate TOTP 2FA secret and QR code for administrator',
        tags: ['admin-2fa'],
        security: [{ bearerAuth: [] }],
        response: {
          200: z.object({
            success: z.boolean(),
            secret: z.string(),
            otpauthUrl: z.string(),
            qrCodeUrl: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const uid = request.user.uid
      let email = request.user.email || 'admin@roomiefinder.com'

      try {
        const adminDoc = await adminDb.collection('admins').doc(uid).get()
        if (adminDoc.exists && adminDoc.data()?.email) {
          email = adminDoc.data()!.email
        } else {
          const userRec = await adminAuth.getUser(uid)
          if (userRec.email) email = userRec.email
        }
      } catch (err) {}

      const setupData = await totpService.generateSecret(email)

      await adminDb.collection('admins').doc(uid).set(
        {
          tempTwoFactorSecret: setupData.secret,
          updatedAt: new Date(),
        },
        { merge: true }
      )

      return {
        success: true,
        secret: setupData.secret,
        otpauthUrl: setupData.otpauthUrl,
        qrCodeUrl: setupData.qrCodeUrl,
      }
    }
  )

  /**
   * POST /admin/2fa/verify
   * Verifies a 6-digit TOTP code against the secret.
   */
  app.post(
    '/admin/2fa/verify',
    {
      preHandler: [authenticate],
      schema: {
        description: 'Verify a TOTP 6-digit code',
        tags: ['admin-2fa'],
        security: [{ bearerAuth: [] }],
        body: z.object({
          code: z.string(),
          secret: z.string().optional(),
        }),
        response: {
          200: z.object({
            success: z.boolean(),
            message: z.string(),
          }),
          400: z.object({
            success: z.boolean(),
            error: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const uid = request.user.uid
      const { code, secret: providedSecret } = request.body

      let targetSecret = providedSecret
      if (!targetSecret) {
        const adminDoc = await adminDb.collection('admins').doc(uid).get()
        if (adminDoc.exists) {
          targetSecret = adminDoc.data()?.tempTwoFactorSecret || adminDoc.data()?.twoFactorSecret
        }
      }

      if (!targetSecret) {
        return reply.status(400).send({ success: false, error: '2FA setup secret not found' })
      }

      const isValid = totpService.verifyToken(code, targetSecret)
      if (!isValid) {
        return reply.status(400).send({ success: false, error: 'Invalid verification code' })
      }

      return { success: true, message: 'TOTP verification successful' }
    }
  )

  /**
   * POST /admin/2fa/enable
   * Enables TOTP 2FA for the administrator.
   */
  app.post(
    '/admin/2fa/enable',
    {
      preHandler: [authenticate],
      schema: {
        description: 'Enable 2FA for administrator account',
        tags: ['admin-2fa'],
        security: [{ bearerAuth: [] }],
        body: z.object({
          secret: z.string(),
        }),
        response: {
          200: z.object({
            success: z.boolean(),
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const uid = request.user.uid
      const { secret } = request.body

      await adminDb.collection('admins').doc(uid).set(
        {
          twoFactorEnabled: true,
          twoFactorSecret: secret,
          updatedAt: new Date(),
        },
        { merge: true }
      )

      await auditService.log({
        actorUid: uid,
        action: '2fa_enabled',
        requestId: request.id,
      })

      return { success: true, message: 'Two-Factor Authentication enabled successfully' }
    }
  )

  // ─── Team Management & Operational Metrics ───────────────────────────────────

  /**
   * GET /admin/team
   * List all administrator accounts
   */
  app.get(
    '/admin/team',
    {
      preHandler: [authenticate, requirePermission('VIEW_AUDIT_LOGS')],
      schema: {
        description: 'Fetch administrator team accounts',
        tags: ['admin-team'],
        security: [{ bearerAuth: [] }],
        response: {
          200: z.object({
            success: z.boolean(),
            admins: z.array(z.any()),
          }),
        },
      },
    },
    async (request, reply) => {
      const snap = await adminDb.collection('admins').get()
      const admins = snap.docs.map((d) => {
        const data = d.data()
        return {
          uid: d.id,
          email: data.email || 'admin@roomiefinder.com',
          displayName: data.displayName || data.email?.split('@')[0] || 'Admin User',
          systemRole: data.systemRole || 'ADMIN',
          status: data.status || 'active',
          twoFactorEnabled: !!data.twoFactorEnabled,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || null,
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt || null,
        }
      })

      return { success: true, admins }
    }
  )

  /**
   * PUT /admin/team/:uid/role
   * Update administrator systemRole (Super Admin only)
   */
  app.put(
    '/admin/team/:uid/role',
    {
      preHandler: [authenticate, requirePermission('PROMOTE_ADMIN')],
      schema: {
        description: 'Update system role of an administrator',
        tags: ['admin-team'],
        security: [{ bearerAuth: [] }],
        params: z.object({
          uid: z.string(),
        }),
        body: z.object({
          systemRole: z.enum(['ADMIN', 'SUPER_ADMIN']),
        }),
        response: {
          200: z.object({
            success: z.boolean(),
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { uid } = request.params
      const { systemRole } = request.body
      const actorUid = request.user.uid

      await adminDb.collection('admins').doc(uid).set(
        {
          systemRole,
          updatedAt: new Date(),
        },
        { merge: true }
      )

      await auditService.log({
        actorUid,
        action: `admin_role_updated_${systemRole}`,
        resource: `admins/${uid}`,
        requestId: request.id,
        metadata: { targetUid: uid, newRole: systemRole },
      })

      return { success: true, message: `Administrator role updated to ${systemRole}` }
    }
  )

  /**
   * PUT /admin/team/:uid/status
   * Toggle administrator account status (active / disabled)
   */
  app.put(
    '/admin/team/:uid/status',
    {
      preHandler: [authenticate, requirePermission('DISABLE_ADMIN')],
      schema: {
        description: 'Update status of an administrator account',
        tags: ['admin-team'],
        security: [{ bearerAuth: [] }],
        params: z.object({
          uid: z.string(),
        }),
        body: z.object({
          status: z.enum(['active', 'disabled']),
        }),
        response: {
          200: z.object({
            success: z.boolean(),
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { uid } = request.params
      const { status } = request.body
      const actorUid = request.user.uid

      if (uid === actorUid) {
        return reply.status(400).send({ success: false, message: 'Cannot disable your own admin account' })
      }

      await adminDb.collection('admins').doc(uid).set(
        {
          status,
          updatedAt: new Date(),
        },
        { merge: true }
      )

      await auditService.log({
        actorUid,
        action: `admin_status_${status}`,
        resource: `admins/${uid}`,
        requestId: request.id,
        metadata: { targetUid: uid, newStatus: status },
      })

      return { success: true, message: `Administrator status updated to ${status}` }
    }
  )

  /**
   * GET /admin/metrics
   * Aggregate metrics across profiles, listings, reports, and matches
   */
  app.get(
    '/admin/metrics',
    {
      preHandler: [authenticate, requirePermission('VIEW_METRICS')],
      schema: {
        description: 'Aggregate platform operational metrics',
        tags: ['admin-metrics'],
        security: [{ bearerAuth: [] }],
        response: {
          200: z.object({
            success: z.boolean(),
            metrics: z.object({
              totalUsers: z.number(),
              bannedUsers: z.number(),
              totalListings: z.number(),
              pausedListings: z.number(),
              pendingReports: z.number(),
              resolvedReports: z.number(),
              totalMatches: z.number(),
              users: z.object({
                total: z.number(),
                active: z.number(),
                banned: z.number(),
              }),
              listings: z.object({
                total: z.number(),
                active: z.number(),
                paused: z.number(),
                flagged: z.number(),
                filled: z.number(),
              }),
              reports: z.object({
                total: z.number(),
                pending: z.number(),
                under_review: z.number(),
                resolved: z.number(),
              }),
              matches: z.object({
                total: z.number(),
                matched: z.number(),
              }),
              admins: z.object({
                total: z.number(),
                superAdmins: z.number(),
                regularAdmins: z.number(),
              }),
            }),
          }),
        },
      },
    },
    async (request, reply) => {
      const [profilesSnap, listingsSnap, reportsSnap, matchesSnap, adminsSnap] = await Promise.all([
        adminDb.collection('profiles').get(),
        adminDb.collection('listings').get(),
        adminDb.collection('reports').get(),
        adminDb.collection('matches').get(),
        adminDb.collection('admins').get(),
      ])

      const usersTotal = profilesSnap.size
      const usersBanned = profilesSnap.docs.filter((d) => d.data().status === 'banned').length
      const usersActive = Math.max(0, usersTotal - usersBanned)

      const listingsTotal = listingsSnap.size
      const listingsActive = listingsSnap.docs.filter((d) => (d.data().status || 'active') === 'active').length
      const listingsPaused = listingsSnap.docs.filter((d) => d.data().status === 'paused').length
      const listingsFlagged = listingsSnap.docs.filter((d) => d.data().status === 'flagged').length
      const listingsFilled = listingsSnap.docs.filter((d) => d.data().status === 'filled').length

      const reportsTotal = reportsSnap.size
      const reportsPending = reportsSnap.docs.filter((d) => (d.data().status || 'pending') === 'pending').length
      const reportsUnderReview = reportsSnap.docs.filter((d) => d.data().status === 'under_review').length
      const reportsResolved = reportsSnap.docs.filter((d) => d.data().status === 'resolved').length

      const matchesTotal = matchesSnap.size

      const adminsTotal = adminsSnap.size
      const superAdmins = adminsSnap.docs.filter((d) => d.data().systemRole === 'SUPER_ADMIN').length
      const regularAdmins = Math.max(0, adminsTotal - superAdmins)

      return {
        success: true,
        metrics: {
          totalUsers: usersTotal,
          bannedUsers: usersBanned,
          totalListings: listingsTotal,
          pausedListings: listingsPaused + listingsFlagged,
          pendingReports: reportsPending,
          resolvedReports: reportsResolved,
          totalMatches: matchesTotal,
          users: {
            total: usersTotal,
            active: usersActive,
            banned: usersBanned,
          },
          listings: {
            total: listingsTotal,
            active: listingsActive,
            paused: listingsPaused,
            flagged: listingsFlagged,
            filled: listingsFilled,
          },
          reports: {
            total: reportsTotal,
            pending: reportsPending,
            under_review: reportsUnderReview,
            resolved: reportsResolved,
          },
          matches: {
            total: matchesTotal,
            matched: matchesTotal,
          },
          admins: {
            total: adminsTotal,
            superAdmins,
            regularAdmins,
          },
        },
      }
    }
  )
}
