import { EventBus } from '../events/EventBus'
import { Events } from '../events/EventCatalogue'
import { Notification } from '../domain/models'
import { notificationRepository } from '../repositories/NotificationRepository'
import { logger } from '../utils/logger'

export class NotificationService {
  constructor() {
    this.setupListeners()
  }

  private setupListeners() {
    EventBus.subscribe(Events.MATCH_CREATED, async (payload) => {
      try {
        const notifA = Notification.create(
          payload.userA,
          'match',
          "It's a Match! 🎉",
          `You matched with a roommate! Start a conversation.`,
          { matchId: payload.matchId, link: `/messages/${payload.matchId}` }
        )
        await notificationRepository.save(notifA)

        const notifB = Notification.create(
          payload.userB,
          'match',
          "It's a Match! 🎉",
          `You matched with a roommate! Start a conversation.`,
          { matchId: payload.matchId, link: `/messages/${payload.matchId}` }
        )
        await notificationRepository.save(notifB)
      } catch (err) {
        logger.error({ msg: 'Error processing MATCH_CREATED notification', err })
      }
    })

    EventBus.subscribe(Events.REPORT_RESOLVED, async (payload) => {
      try {
        logger.info({ msg: 'Report resolved event received', reportId: payload.reportId })
      } catch (err) {
        logger.error({ msg: 'Error processing REPORT_RESOLVED notification', err })
      }
    })

    EventBus.subscribe(Events.APPEAL_DECISION, async (payload: any) => {
      try {
        const notif = Notification.create(
          payload.uid,
          'appeal',
          'Appeal Decision Update',
          `Your appeal has been reviewed and marked as ${payload.decision}`,
          { link: '/security' }
        )
        await notificationRepository.save(notif)
      } catch (err) {
        logger.error({ msg: 'Error processing APPEAL_DECISION notification', err })
      }
    })

    EventBus.subscribe(Events.ADMIN_ACCEPTED, async (payload) => {
      try {
        logger.info({ msg: 'Admin invitation accepted', uid: payload.uid, email: payload.email })
      } catch (err) {
        logger.error({ msg: 'Error processing ADMIN_ACCEPTED notification', err })
      }
    })
  }

  async create(params: {
    recipientId: string
    type: string
    title: string
    body: string
    link?: string
    senderId?: string
  }) {
    const notif = Notification.create(
      params.recipientId,
      params.type as any,
      params.title,
      params.body,
      { link: params.link, senderId: params.senderId }
    )
    await notificationRepository.save(notif)
    return notif
  }
}

export const notificationService = new NotificationService()
