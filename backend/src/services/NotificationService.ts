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
      // Send to User A
      const notifA = Notification.create(
        payload.userA,
        'match',
        "It's a Match! 🎉",
        `You matched with a user! Start a conversation.`,
        { matchId: payload.matchId, link: `/messages/${payload.matchId}` }
      )
      await notificationRepository.save(notifA)

      // Send to User B
      const notifB = Notification.create(
        payload.userB,
        'match',
        "It's a Match! 🎉",
        `You matched with a user! Start a conversation.`,
        { matchId: payload.matchId, link: `/messages/${payload.matchId}` }
      )
      await notificationRepository.save(notifB)
    })

    EventBus.subscribe(Events.MESSAGE_SENT, async (payload) => {
      // In a real app we'd fetch the chat participants to see who receives it
      // Since MESSAGE_SENT is just matchId and senderUid, we'd need ChatRepository here
      // to find the recipient. I'll just log it for now and we can add ChatRepository
      // when we flesh out the Message flow.
      logger.info({ msg: 'Message sent, would notify other participant', matchId: payload.matchId })
    })

    EventBus.subscribe(Events.REPORT_RESOLVED, async (payload) => {
      // Fetch report details if needed, but for now we just log it
      logger.info({ msg: 'Report resolved, would notify reporter', reportId: payload.reportId })
    })

    EventBus.subscribe(Events.APPEAL_DECISION, async (payload: any) => {
      // If we add this to EventCatalogue, we can notify the user
      const notif = Notification.create(
        payload.uid,
        'appeal',
        'Appeal Decision',
        `Your appeal has been ${payload.decision}`,
        { link: '/security' }
      )
      await notificationRepository.save(notif)
    })
  }
}

export const notificationService = new NotificationService()
