import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { authenticate } from '../middleware/authenticate'
import { requirePermission } from '../middleware/authorize'
import { adminDb } from '../config/firebase'
import { auditService } from '../services/AuditService'
import { hydrateUserIdentities } from '../utils/identityHydrator'

export const adminListingsRoutes: FastifyPluginAsyncZod = async (app) => {
  /**
   * GET /admin/listings
   * Search and filter listings for administration
   */
  app.get(
    '/admin/listings',
    {
      preHandler: [authenticate, requirePermission('MANAGE_LISTINGS')],
      schema: {
        description: 'Fetch and search listings for admin platform',
        tags: ['admin-listings'],
        security: [{ bearerAuth: [] }],
        querystring: z.object({
          status: z.enum(['all', 'active', 'paused', 'flagged', 'filled']).default('all'),
          search: z.string().optional(),
          limit: z.coerce.number().min(1).max(100).default(50),
        }),
        response: {
          200: z.object({
            success: z.boolean(),
            listings: z.array(z.any()),
          }),
        },
      },
    },
    async (request, reply) => {
      const { status, search, limit } = request.query
      
      let queryRef: FirebaseFirestore.Query = adminDb.collection('listings')
      if (status !== 'all') {
        queryRef = queryRef.where('status', '==', status)
      }

      const snap = await queryRef.limit(limit).get()

      const rawListings = snap.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          title: data.title || `${data.housingType || 'Room'} in ${data.zone || 'Campus Area'}`,
          hostId: data.hostId || '',
          zone: data.zone || data.location?.zone || 'Campus Area',
          rentAmount: data.roommateShare || data.rentTotal || data.rentAmount || data.price || 0,
          rentTotal: data.rentTotal || 0,
          roommateShare: data.roommateShare || 0,
          status: data.status || 'active',
          isFeatured: data.isFeatured || false,
          isVerified: data.isVerified || false,
          images: data.photos || data.images || [],
          description: data.description || '',
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || null,
        }
      })

      // Batch hydrate host identities
      const hostUids = rawListings.map((l) => l.hostId)
      const identities = await hydrateUserIdentities(hostUids)

      let listings = rawListings.map((listing) => {
        const hostIdentity = listing.hostId ? identities.get(listing.hostId) : null
        return {
          ...listing,
          hostName: hostIdentity?.displayName || 'Student Host',
          host: hostIdentity
            ? {
                uid: hostIdentity.uid,
                name: hostIdentity.displayName,
                email: hostIdentity.email,
                role: hostIdentity.role,
                avatar: hostIdentity.photoURL,
              }
            : null,
        }
      })

      if (search && search.trim().length > 0) {
        const searchLower = search.toLowerCase()
        listings = listings.filter(
          (l) =>
            l.title.toLowerCase().includes(searchLower) ||
            l.zone.toLowerCase().includes(searchLower) ||
            l.hostId.toLowerCase().includes(searchLower) ||
            l.hostName.toLowerCase().includes(searchLower) ||
            l.id.toLowerCase().includes(searchLower)
        )
      }

      return { success: true, listings }
    }
  )

  /**
   * PUT /admin/listings/:id/status
   * Update listing status (active, paused, flagged)
   */
  app.put(
    '/admin/listings/:id/status',
    {
      preHandler: [authenticate, requirePermission('MANAGE_LISTINGS')],
      schema: {
        description: 'Update status of a listing',
        tags: ['admin-listings'],
        security: [{ bearerAuth: [] }],
        params: z.object({
          id: z.string(),
        }),
        body: z.object({
          status: z.enum(['active', 'paused', 'flagged', 'filled']),
        }),
        response: {
          200: z.object({
            success: z.boolean(),
            message: z.string(),
          }),
          404: z.object({ error: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params
      const { status } = request.body
      const adminUid = request.user.uid

      const docRef = adminDb.collection('listings').doc(id)
      const doc = await docRef.get()
      if (!doc.exists) {
        return reply.status(404).send({ error: 'Listing not found' })
      }

      await docRef.update({
        status,
        updatedAt: new Date(),
      })

      await auditService.log({
        actorUid: adminUid,
        action: `listing_status_${status}`,
        resource: `listings/${id}`,
        requestId: request.id,
        metadata: { newStatus: status },
      })

      return { success: true, message: `Listing status updated to ${status}` }
    }
  )

  /**
   * PUT /admin/listings/:id/featured
   * Toggle featured status of a listing
   */
  app.put(
    '/admin/listings/:id/featured',
    {
      preHandler: [authenticate, requirePermission('MANAGE_LISTINGS')],
      schema: {
        description: 'Toggle featured state of a listing',
        tags: ['admin-listings'],
        security: [{ bearerAuth: [] }],
        params: z.object({
          id: z.string(),
        }),
        body: z.object({
          isFeatured: z.boolean(),
        }),
        response: {
          200: z.object({
            success: z.boolean(),
            message: z.string(),
          }),
          404: z.object({ error: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params
      const { isFeatured } = request.body
      const adminUid = request.user.uid

      const docRef = adminDb.collection('listings').doc(id)
      const doc = await docRef.get()
      if (!doc.exists) {
        return reply.status(404).send({ error: 'Listing not found' })
      }

      await docRef.update({
        isFeatured,
        updatedAt: new Date(),
      })

      await auditService.log({
        actorUid: adminUid,
        action: isFeatured ? 'listing_featured' : 'listing_unfeatured',
        resource: `listings/${id}`,
        requestId: request.id,
      })

      return { success: true, message: `Listing featured status set to ${isFeatured}` }
    }
  )

  /**
   * DELETE /admin/listings/:id
   * Hard delete a listing (Super Admin only: DELETE_LISTING)
   */
  app.delete(
    '/admin/listings/:id',
    {
      preHandler: [authenticate, requirePermission('DELETE_LISTING')],
      schema: {
        description: 'Hard delete a listing (Super Admin only)',
        tags: ['admin-listings'],
        security: [{ bearerAuth: [] }],
        params: z.object({
          id: z.string(),
        }),
        response: {
          200: z.object({
            success: z.boolean(),
            message: z.string(),
          }),
          404: z.object({ error: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params
      const adminUid = request.user.uid

      const docRef = adminDb.collection('listings').doc(id)
      const doc = await docRef.get()
      if (!doc.exists) {
        return reply.status(404).send({ error: 'Listing not found' })
      }

      await docRef.delete()

      await auditService.log({
        actorUid: adminUid,
        action: 'listing_deleted',
        resource: `listings/${id}`,
        requestId: request.id,
      })

      return { success: true, message: 'Listing permanently removed' }
    }
  )
}
