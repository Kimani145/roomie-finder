import { adminDb } from '../config/firebase'
import { Report } from '../domain/models'

export class ReportRepository {
  private collection = adminDb.collection('reports')

  async getById(id: string): Promise<Report | null> {
    const doc = await this.collection.doc(id).get()
    if (!doc.exists) return null
    return Report.fromFirestore(doc.id, doc.data())
  }

  async save(report: Report): Promise<void> {
    if (!report.id) {
      const docRef = await this.collection.add(report.toJSON())
      report.id = docRef.id
    } else {
      await this.collection.doc(report.id).set(report.toJSON(), { merge: true })
    }
  }

  async getPendingByReportedUserId(reportedUserId: string): Promise<Report[]> {
    const snapshot = await this.collection
      .where('reportedUserId', '==', reportedUserId)
      .where('status', '==', 'pending')
      .get()
    return snapshot.docs.map(doc => Report.fromFirestore(doc.id, doc.data()))
  }
}

export const reportRepository = new ReportRepository()
