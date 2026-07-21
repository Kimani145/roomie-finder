import { adminDb } from '../config/firebase'
import { Chat, Message } from '../domain/models'

export class ChatRepository {
  private collection = adminDb.collection('chats')

  async getById(id: string): Promise<Chat | null> {
    const doc = await this.collection.doc(id).get()
    if (!doc.exists) return null
    return Chat.fromFirestore(doc.id, doc.data())
  }

  async save(chat: Chat): Promise<void> {
    await this.collection.doc(chat.id).set(chat.toJSON(), { merge: true })
  }

  async saveMessage(message: Message): Promise<void> {
    const messagesColl = this.collection.doc(message.matchId).collection('messages')
    if (!message.id) {
      const docRef = await messagesColl.add(message.toJSON())
      message.id = docRef.id
    } else {
      await messagesColl.doc(message.id).set(message.toJSON(), { merge: true })
    }
  }
}

export const chatRepository = new ChatRepository()
