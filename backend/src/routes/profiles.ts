import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { authenticate } from '../middleware/authenticate'
import { profileRepository } from '../repositories/ProfileRepository'
import { Profile } from '../domain/models'
import { EventBus } from '../events/EventBus'
import { Events } from '../events/EventCatalogue'
import { adminAuth } from '../config/firebase'

export const profileRoutes: FastifyPluginAsyncZod = async (app) => {
  // Create Profile
  app.post(
    '/',
    {
      preHandler: [authenticate],
      schema: {
        body: z.object({
          displayName: z.string().min(1),
          role: z.enum(['HOST', 'SEEKER', 'FLEX']),
          email: z.string().email(),
          // include any other fields needed
        }).passthrough(),
      },
    },
    async (request, reply) => {
      const uid = request.user!.uid
      
      const existing = await profileRepository.getById(uid)
      if (existing) {
        return reply.status(409).send({ message: 'Profile already exists' })
      }

      const body = request.body as any
      const profile = new Profile(uid, body.displayName, body.email, body.role, 'active', false, body)
      
      await profileRepository.save(profile)
      EventBus.publish(Events.PROFILE_CREATED, { uid })
      
      return reply.status(201).send(profile.toJSON())
    }
  )

  // Update Profile
  app.put(
    '/me',
    {
      preHandler: [authenticate],
      schema: {
        body: z.object({}).passthrough(),
      },
    },
    async (request, reply) => {
      const uid = request.user!.uid
      
      const profile = await profileRepository.getById(uid)
      if (!profile) {
        return reply.status(404).send({ message: 'Profile not found' })
      }

      const updates = request.body as any
      if (updates.displayName) profile.displayName = updates.displayName
      if (updates.twoFactorEnabled !== undefined) profile.twoFactorEnabled = updates.twoFactorEnabled
      
      // Update metadata
      profile.metadata = { ...profile.metadata, ...updates }
      
      await profileRepository.save(profile)
      EventBus.publish(Events.PROFILE_UPDATED, { uid, changes: updates })
      
      return reply.status(200).send(profile.toJSON())
    }
  )

  // Delete Profile
  app.delete(
    '/me',
    {
      preHandler: [authenticate],
    },
    async (request, reply) => {
      const uid = request.user!.uid
      
      // Disable the auth user
      await adminAuth.updateUser(uid, { disabled: true })
      
      // We keep the profile but mark it deleted/banned/inactive
      const profile = await profileRepository.getById(uid)
      if (profile) {
        profile.status = 'inactive'
        await profileRepository.save(profile)
      }
      
      EventBus.publish(Events.ACCOUNT_DELETED, { uid })
      
      return reply.status(200).send({ message: 'Account deleted' })
    }
  )
}
