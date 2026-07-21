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
   * POST /chats/:chatId/messages
   * Sends a message within a matched chat.
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
          403: z.object({ error: z.string() }),
          404: z.object({ error: z.string() })
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
      
      if (!chatData.participants?.includes(senderUid)) {
        return reply.status(403).send({ error: 'Forbidden: You are not a participant in this chat' })
      }

      if (chatData.status === 'unmatched') {
        return reply.status(403).send({ error: 'Forbidden: This match has been unmatched' })
      }

      const trimmedText = text.trim()
      const recipientUid = chatData.participants.find((id: string) => id !== senderUid)

      // 2. Perform the message write and chat update transactionally or sequentially 
      // (a batch write is sufficient since we don't need a read-modify-write)
      const batch = adminDb.batch()
      
      const messagesRef = chatRef.collection('messages')
      const newMessageRef = messagesRef.doc()

      batch.set(newMessageRef, {
        senderUid,
        text: trimmedText,
        createdAt: FieldValue.serverTimestamp(),
      })

      batch.update(chatRef, {
        lastMessage: trimmedText,
        updatedAt: FieldValue.serverTimestamp(),
        lastMessageTime: FieldValue.serverTimestamp(),
        unreadBy: recipientUid ? [recipientUid] : [],
      })

      await batch.commit()

      // 3. Post-commit: Generate Notification
      if (recipientUid) {
        // Find sender's name for the notification
        let senderName = 'A user'
        try {
          const senderProfile = await adminDb.collection('profiles').doc(senderUid).get()
          if (senderProfile.exists) {
            senderName = senderProfile.data()?.displayName || senderName
          }
        } catch (err) {}

        await notificationService.create({
          recipientId: recipientUid,
          type: 'message',
          title: `New message from ${senderName}`,
          body: trimmedText.length > 50 ? trimmedText.substring(0, 50) + '...' : trimmedText,
          link: `/messages/${chatId}`,
          senderId: senderUid
        }).catch(err => request.log.error({ msg: 'Failed to create message notification', err }))
      }

      // 4. Audit Log
      await auditService.log({
        actorUid: senderUid,
        action: 'message_sent',
        resource: `chats/${chatId}/messages/${newMessageRef.id}`,
        requestId,
        metadata: { chatId, messageLength: trimmedText.length }
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
    async (request, reply) => {
      const { chatId } = request.params
      const userId = request.user.uid

      const chatRef = adminDb.collection('chats').doc(chatId)
      
      // We don't strictly need to read first, we can just arrayRemove
      await chatRef.update({
        unreadBy: FieldValue.arrayRemove(userId)
      })

      return { success: true }
    }
  )
}
