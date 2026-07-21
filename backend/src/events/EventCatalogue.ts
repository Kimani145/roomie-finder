// Strongly typed event catalogue for the application
export const Events = {
  USER_REGISTERED: 'USER_REGISTERED',
  PROFILE_CREATED: 'PROFILE_CREATED',
  PROFILE_UPDATED: 'PROFILE_UPDATED',
  LISTING_CREATED: 'LISTING_CREATED',
  LISTING_UPDATED: 'LISTING_UPDATED',
  LISTING_DELETED: 'LISTING_DELETED',
  PROFILE_LIKED: 'PROFILE_LIKED',
  MATCH_CREATED: 'MATCH_CREATED',
  MATCH_ARCHIVED: 'MATCH_ARCHIVED',
  MESSAGE_SENT: 'MESSAGE_SENT',
  REPORT_SUBMITTED: 'REPORT_SUBMITTED',
  REPORT_RESOLVED: 'REPORT_RESOLVED',
  APPEAL_DECISION: 'APPEAL_DECISION',
  ADMIN_INVITED: 'ADMIN_INVITED',
  ADMIN_ACCEPTED: 'ADMIN_ACCEPTED',
  OTP_REQUESTED: 'OTP_REQUESTED',
  PASSWORD_RESET_REQUESTED: 'PASSWORD_RESET_REQUESTED',
  ACCOUNT_DELETED: 'ACCOUNT_DELETED'
} as const

export type AppEvent = typeof Events[keyof typeof Events]

// Define expected payloads for each event
export interface EventPayloads {
  [Events.USER_REGISTERED]: { uid: string, email: string }
  [Events.PROFILE_CREATED]: { uid: string }
  [Events.PROFILE_UPDATED]: { uid: string, changes: any }
  [Events.LISTING_CREATED]: { id: string, hostId: string }
  [Events.LISTING_UPDATED]: { id: string }
  [Events.LISTING_DELETED]: { id: string }
  [Events.PROFILE_LIKED]: { fromUid: string, toUid: string }
  [Events.MATCH_CREATED]: { matchId: string, userA: string, userB: string }
  [Events.MATCH_ARCHIVED]: { matchId: string }
  [Events.MESSAGE_SENT]: { matchId: string, senderUid: string, messageId: string }
  [Events.REPORT_SUBMITTED]: { reportId: string, reportedBy: string, reportedUserId: string }
  [Events.REPORT_RESOLVED]: { reportId: string, status: string }
  [Events.APPEAL_DECISION]: { uid: string, appealId: string, decision: string }
  [Events.ADMIN_INVITED]: { email: string, role: string, token: string }
  [Events.ADMIN_ACCEPTED]: { uid: string, email: string }
  [Events.OTP_REQUESTED]: { email: string, otp: string, purpose: string }
  [Events.PASSWORD_RESET_REQUESTED]: { email: string, token: string }
  [Events.ACCOUNT_DELETED]: { uid: string }
}
