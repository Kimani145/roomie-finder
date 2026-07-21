import { adminDb } from '../config/firebase'
import { Notification } from '../domain/models'

export class NotificationRepository {
  private collection = adminDb.collection('notifications')

  async save(notification: Notification): Promise<void> {
    if (!notification.id) {
      const docRef = await this.collection.add(notification.toJSON())
      notification.id = docRef.id
    } else {
      await this.collection.doc(notification.id).set(notification.toJSON(), { merge: true })
    }
  }

  async getById(id: string): Promise<Notification | null> {
    const doc = await this.collection.doc(id).get()
    if (!doc.exists) return null
    return Notification.fromFirestore(doc.id, doc.data())
  }
}

export const notificationRepository = new NotificationRepository()
