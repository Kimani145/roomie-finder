import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { authenticate } from '../middleware/authenticate'
import { listingRepository } from '../repositories/ListingRepository'
import { Listing } from '../domain/models'
import { EventBus } from '../events/EventBus'
import { Events } from '../events/EventCatalogue'
import { adminDb } from '../config/firebase'

export const listingRoutes: FastifyPluginAsyncZod = async (app) => {
  // Create Listing
  app.post(
    '/',
    {
      preHandler: [authenticate],
      schema: {
        body: z.object({
          zone: z.string(),
          // Include other listing fields
        }).passthrough(),
      },
    },
    async (request, reply) => {
      const uid = request.user!.uid
      const body = request.body as any
      
      const docRef = adminDb.collection('listings').doc()
      const listing = new Listing(docRef.id, uid, body.zone, 'active', body)
      
      const batch = adminDb.batch()
      const activeListings = await adminDb.collection('listings')
        .where('hostId', '==', uid)
        .where('status', '==', 'active')
        .get()
        
      activeListings.forEach(doc => {
        batch.update(doc.ref, { status: 'paused' })
      })
      
      batch.set(docRef, { ...listing.toJSON(), id: docRef.id })
      await batch.commit()
      EventBus.publish(Events.LISTING_CREATED, { id: listing.id, hostId: uid })
      
      return reply.status(201).send(listing.toJSON())
    }
  )

  // Update Listing
  app.put(
    '/:id',
    {
      preHandler: [authenticate],
      schema: {
        params: z.object({ id: z.string() }),
        body: z.object({}).passthrough(),
      },
    },
    async (request, reply) => {
      const uid = request.user!.uid
      const { id } = request.params
      
      const listing = await listingRepository.getById(id)
      if (!listing) {
        return reply.status(404).send({ message: 'Listing not found' })
      }
      if (listing.hostId !== uid) {
        return reply.status(403).send({ message: 'Not authorized to edit this listing' })
      }

      const updates = request.body as any
      if (updates.status) listing.status = updates.status
      if (updates.zone) listing.zone = updates.zone
      listing.metadata = { ...listing.metadata, ...updates }
      
      await listingRepository.save(listing)
      EventBus.publish(Events.LISTING_UPDATED, { id })
      
      return reply.status(200).send(listing.toJSON())
    }
  )

  // Delete Listing
  app.delete(
    '/:id',
    {
      preHandler: [authenticate],
      schema: {
        params: z.object({ id: z.string() }),
      },
    },
    async (request, reply) => {
      const uid = request.user!.uid
      const { id } = request.params
      
      const listing = await listingRepository.getById(id)
      if (!listing) {
        return reply.status(404).send({ message: 'Listing not found' })
      }
      if (listing.hostId !== uid) {
        return reply.status(403).send({ message: 'Not authorized to delete this listing' })
      }
      
      await listingRepository.delete(id)
      EventBus.publish(Events.LISTING_DELETED, { id })
      
      return reply.status(200).send({ message: 'Listing deleted' })
    }
  )
}
