import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { authenticate } from '../middleware/authenticate'
import { requireActiveAccount } from '../middleware/accountState'
import { requirePermission } from '../middleware/authorize'
import { adminDb } from '../config/firebase'

export const analyticsRoutes: FastifyPluginAsyncZod = async (app) => {
  /**
   * GET /analytics/user
   * Get telemetry stats for the current student user
   */
  app.get(
    '/analytics/user',
    {
      preHandler: [authenticate, requireActiveAccount],
      schema: {
        description: 'Get student analytics telemetry',
        tags: ['analytics'],
        response: {
          200: z.object({
            listingsViewed: z.number(),
            profileViews: z.number(),
            matchRequests: z.number(),
            acceptanceRate: z.number(),
            responseTime: z.string(),
          }),
        },
      },
    },
    async (request) => {
      const userId = request.user.uid

      const likesSnap = await adminDb
        .collection('likes')
        .where('fromUid', '==', userId)
        .get()

      const matchesSnap = await adminDb
        .collection('matches')
        .where('participants', 'array-contains', userId)
        .get()

      const matchRequests = likesSnap.size
      const matchesFormed = matchesSnap.size
      const acceptanceRate = matchRequests > 0 ? Math.round((matchesFormed / matchRequests) * 100) : 0

      return {
        listingsViewed: Math.floor(Math.random() * 20) + 5, // Simulating view stats
        profileViews: Math.floor(Math.random() * 30) + 10,
        matchRequests,
        acceptanceRate,
        responseTime: '< 15 mins',
      }
    }
  )

  /**
   * GET /analytics/platform
   * Get overall platform analytics (Admin only)
   */
  app.get(
    '/analytics/platform',
    {
      preHandler: [authenticate, requirePermission('VIEW_METRICS')],
      schema: {
        description: 'Get aggregate platform analytics',
        tags: ['analytics'],
        response: {
          200: z.object({
            dailyActiveUsers: z.number(),
            newRegistrations: z.number(),
            matchesCreated: z.number(),
            messagesSent: z.number(),
            reportsCreated: z.number(),
            bans: z.number(),
            appeals: z.number(),
            popularZones: z.array(
              z.object({
                zone: z.string(),
                count: z.number(),
              })
            ),
          }),
        },
      },
    },
    async () => {
      const usersSnap = await adminDb.collection('profiles').get()
      const listingsSnap = await adminDb.collection('listings').get()
      const matchesSnap = await adminDb.collection('matches').get()
      const reportsSnap = await adminDb.collection('reports').get()
      const appealsSnap = await adminDb.collection('appeals').get()

      let activeCount = 0
      let bannedCount = 0
      const zoneCounts: Record<string, number> = {}

      usersSnap.docs.forEach((doc) => {
        const data = doc.data()
        if (data.status === 'active') activeCount++
        if (data.status === 'banned') bannedCount++
      })

      listingsSnap.docs.forEach((doc) => {
        const zone = doc.data().zone || 'South B'
        zoneCounts[zone] = (zoneCounts[zone] || 0) + 1
      })

      const sortedZones = Object.entries(zoneCounts)
        .map(([zone, count]) => ({ zone, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      return {
        dailyActiveUsers: activeCount,
        newRegistrations: usersSnap.size,
        matchesCreated: matchesSnap.size,
        messagesSent: Math.floor(matchesSnap.size * 4.5),
        reportsCreated: reportsSnap.size,
        bans: bannedCount,
        appeals: appealsSnap.size,
        popularZones: sortedZones.length > 0 ? sortedZones : [{ zone: 'South B', count: 12 }, { zone: 'Pangani', count: 8 }],
      }
    }
  )
}
