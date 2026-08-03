import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { authenticate } from '../middleware/authenticate'
import { profileRepository } from '../repositories/ProfileRepository'
import { Profile } from '../domain/models'
import { EventBus } from '../events/EventBus'
import { Events } from '../events/EventCatalogue'
import { adminAuth } from '../config/firebase'

export const profileRoutes: FastifyPluginAsyncZod = async (app) => {
  // Create Profile / Onboarding
  app.post(
    '/',
    {
      preHandler: [authenticate],
      schema: {
        body: z.object({
          displayName: z.string().min(1),
          role: z.enum(['HOST', 'SEEKER', 'FLEX']),
        }).passthrough(),
      },
    },
    async (request, reply) => {
      const uid = request.user!.uid
      const email = request.user!.email || ''

      const body = request.body as any
      const existing = await profileRepository.getById(uid)

      if (existing) {
        if (body.displayName) existing.displayName = body.displayName
        if (body.role) existing.role = body.role
        existing.metadata = { ...existing.metadata, ...body }
        await profileRepository.save(existing)
        EventBus.publish(Events.PROFILE_UPDATED, { uid, changes: body })
        return reply.status(200).send(existing.toJSON())
      }

      const profile = new Profile(uid, body.displayName, email, body.role, 'active', false, body)
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
      const email = request.user!.email || ''
      const updates = request.body as any

      let profile = await profileRepository.getById(uid)
      if (!profile) {
        profile = new Profile(
          uid,
          updates.displayName || '',
          email,
          updates.role || 'SEEKER',
          'active',
          false,
          updates
        )
      } else {
        if (updates.displayName) profile.displayName = updates.displayName
        if (updates.role) profile.role = updates.role
        if (updates.twoFactorEnabled !== undefined) profile.twoFactorEnabled = updates.twoFactorEnabled
        profile.metadata = { ...profile.metadata, ...updates }
      }

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
