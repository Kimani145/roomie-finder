import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { authenticate } from '../middleware/authenticate'
import { requireActiveAccount } from '../middleware/accountState'
import { adminDb } from '../config/firebase'
import { FieldValue } from 'firebase-admin/firestore'
import { notificationService } from '../services/NotificationService'
import { auditService } from '../services/AuditService'

export const chatRoutes: FastifyPluginAsyncZod = async (app) => {
  /**
   * GET /chats
   * List all active conversations for the authenticated user
   */
  app.get(
    '/chats',
    {
      preHandler: [authenticate, requireActiveAccount],
      schema: {
        description: 'Get user conversations',
        tags: ['chats'],
        response: {
          200: z.object({
            chats: z.array(
              z.object({
                id: z.string(),
                participants: z.array(z.string()),
                lastMessage: z.string().optional(),
                lastMessageTime: z.string().nullable().optional(),
                updatedAt: z.string().nullable().optional(),
                unreadBy: z.array(z.string()).optional(),
                status: z.string().optional(),
                otherUser: z.object({
                  uid: z.string(),
                  displayName: z.string(),
                  photoURL: z.string().optional(),
                  role: z.string().optional(),
                  status: z.string().optional(),
                  onlineStatus: z.string().optional(),
                }).nullable().optional(),
              })
            ),
          }),
        },
      },
    },
    async (request) => {
      const senderUid = request.user.uid

      const snapshot = await adminDb
        .collection('chats')
        .where('participants', 'array-contains', senderUid)
        .orderBy('updatedAt', 'desc')
        .get()

      const chats = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const data = docSnap.data()
          if (data.status === 'unmatched') return null

          const participants: string[] = data.participants || []
          const recipientUid = participants.find((id) => id !== senderUid)

          let otherUser = null
          if (recipientUid) {
            try {
              const profileSnap = await adminDb.collection('profiles').doc(recipientUid).get()
              if (profileSnap.exists) {
                const pData = profileSnap.data()!
                otherUser = {
                  uid: profileSnap.id,
                  displayName: pData.displayName || 'Roomie Finder User',
                  photoURL: pData.photoURL || undefined,
                  role: pData.role || undefined,
                  status: pData.status || 'active',
                  onlineStatus: pData.onlineStatus || 'offline',
                }
              }
            } catch (err) {}
          }

          return {
            id: docSnap.id,
            participants,
            lastMessage: data.lastMessage || '',
            lastMessageTime: data.lastMessageTime?.toDate ? data.lastMessageTime.toDate().toISOString() : null,
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : null,
            unreadBy: data.unreadBy || [],
            status: data.status || 'active',
            otherUser,
          }
        })
      )

      return {
        chats: chats.filter(Boolean) as any[],
      }
    }
  )

  /**
   * POST /chats/:chatId/messages
   * Sends a message within a matched chat with security validations.
   */
  app.post(
    '/chats/:chatId/messages',
    {
      preHandler: [authenticate, requireActiveAccount],
      config: {
        rateLimit: {
          max: 30, // 30 messages per minute
          timeWindow: '1 minute',
        },
      },
      schema: {
        description: 'Send a message in a chat',
        tags: ['chats'],
        params: z.object({
          chatId: z.string(),
        }),
        body: z.object({
          text: z.string().min(1).max(2000),
        }),
        response: {
          200: z.object({
            success: z.boolean(),
            messageId: z.string(),
          }),
          400: z.object({ error: z.string() }),
          403: z.object({ error: z.string() }),
          404: z.object({ error: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const { chatId } = request.params
      const { text } = request.body
      const senderUid = request.user.uid
      const requestId = request.id

      // 1. Verify the chat exists and user is a participant
      const chatRef = adminDb.collection('chats').doc(chatId)
      const chatSnap = await chatRef.get()

      if (!chatSnap.exists) {
        return reply.status(404).send({ error: 'Chat not found' })
      }

      const chatData = chatSnap.data()!
      const participants: string[] = chatData.participants || []

      if (!participants.includes(senderUid)) {
        return reply.status(403).send({ error: 'Forbidden: You are not a participant in this chat' })
      }

      if (chatData.status === 'unmatched') {
        return reply.status(403).send({ error: 'Forbidden: This match has been unmatched' })
      }

      const recipientUid = participants.find((id) => id !== senderUid)

      // Objective 4 Security Guards:
      // a) Prevent self-messaging
      if (!recipientUid || recipientUid === senderUid) {
        return reply.status(400).send({ error: 'Cannot send messages to yourself' })
      }

      // b) Verify recipient profile status (not banned or deleted)
      const recipientSnap = await adminDb.collection('profiles').doc(recipientUid).get()
      if (!recipientSnap.exists) {
        return reply.status(404).send({ error: 'Recipient profile not found' })
      }

      const recipientData = recipientSnap.data()!
      if (recipientData.status === 'banned') {
        return reply.status(403).send({ error: 'Cannot message a banned user' })
      }

      const trimmedText = text.trim()

      // 2. Transactional batch write
      const batch = adminDb.batch()
      const messagesRef = chatRef.collection('messages')
      const newMessageRef = messagesRef.doc()

      batch.set(newMessageRef, {
        senderUid,
        text: trimmedText,
        createdAt: FieldValue.serverTimestamp(),
        read: false,
      })

      batch.update(chatRef, {
        lastMessage: trimmedText,
        updatedAt: FieldValue.serverTimestamp(),
        lastMessageTime: FieldValue.serverTimestamp(),
        unreadBy: FieldValue.arrayUnion(recipientUid),
        typingBy: FieldValue.arrayRemove(senderUid),
      })

      await batch.commit()

      // 3. Generate Notification for recipient
      let senderName = 'A user'
      try {
        const senderProfile = await adminDb.collection('profiles').doc(senderUid).get()
        if (senderProfile.exists) {
          senderName = senderProfile.data()?.displayName || senderName
        }
      } catch (err) {}

      await notificationService
        .create({
          recipientId: recipientUid,
          type: 'message',
          title: `New message from ${senderName}`,
          body: trimmedText.length > 50 ? trimmedText.substring(0, 50) + '...' : trimmedText,
          link: `/messages/${chatId}`,
          senderId: senderUid,
        })
        .catch((err) => request.log.error({ msg: 'Failed to create message notification', err }))

      // 4. Audit Log
      await auditService.log({
        actorUid: senderUid,
        action: 'message_sent',
        resource: `chats/${chatId}/messages/${newMessageRef.id}`,
        requestId,
        metadata: { chatId, messageLength: trimmedText.length },
      })

      return { success: true, messageId: newMessageRef.id }
    }
  )

  /**
   * POST /chats/:chatId/read
   * Marks a chat as read for the current user.
   */
  app.post(
    '/chats/:chatId/read',
    {
      preHandler: [authenticate],
      schema: {
        description: 'Mark a chat as read',
        tags: ['chats'],
        params: z.object({
          chatId: z.string(),
        }),
        response: {
          200: z.object({
            success: z.boolean(),
          }),
        },
      },
    },
    async (request) => {
      const { chatId } = request.params
      const userId = request.user.uid

      const chatRef = adminDb.collection('chats').doc(chatId)

      await chatRef.update({
        unreadBy: FieldValue.arrayRemove(userId),
      })

      return { success: true }
    }
  )

  /**
   * POST /chats/:chatId/typing
   * Broadcast typing status for current user in chat
   */
  app.post(
    '/chats/:chatId/typing',
    {
      preHandler: [authenticate, requireActiveAccount],
      schema: {
        description: 'Set typing indicator status',
        tags: ['chats'],
        params: z.object({
          chatId: z.string(),
        }),
        body: z.object({
          isTyping: z.boolean(),
        }),
        response: {
          200: z.object({
            success: z.boolean(),
          }),
        },
      },
    },
    async (request) => {
      const { chatId } = request.params
      const { isTyping } = request.body
      const userId = request.user.uid

      const chatRef = adminDb.collection('chats').doc(chatId)

      await chatRef.update({
        typingBy: isTyping ? FieldValue.arrayUnion(userId) : FieldValue.arrayRemove(userId),
      })

      return { success: true }
    }
  )
}
